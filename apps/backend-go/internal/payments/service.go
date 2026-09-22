package payments

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	cfg          *config.Config
	repo         *Repository
	toss         *TossClient
	finalization *FinalizationService
	rateLimit    *shared.RateLimitService
}

func NewService(cfg *config.Config, repo *Repository, rateLimit *shared.RateLimitService) *Service {
	return &Service{
		cfg:          cfg,
		repo:         repo,
		toss:         NewTossClient(cfg),
		finalization: NewFinalizationService(),
		rateLimit:    rateLimit,
	}
}

func (s *Service) CreatePaymentOrder(ctx context.Context, user *auth.User, req CreatePaymentOrderRequest) (CreatePaymentOrderResult, error) {
	var result CreatePaymentOrderResult
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		if err := s.rateLimit.AssertRateLimit(ctx, tx, "create-payment:"+user.ID, 20, 60); err != nil {
			return err
		}

		bookingID, err := shared.ParseUUID(req.BookingID)
		if err != nil {
			panic(apierrors.BadRequest("Invalid booking ID"))
		}
		customerID, err := shared.ParseUUID(user.ID)
		if err != nil {
			panic(apierrors.BadRequest("Invalid user ID"))
		}

		order, err := s.repo.CreatePaymentOrder(ctx, tx, bookingID, customerID)
		if err != nil {
			return err
		}

		result = mapCreatePaymentOrderResult(
			shared.UUIDToString(order.PaymentID),
			shared.UUIDToString(order.OrderID),
			shared.UUIDToString(order.BookingID),
			int(order.AmountKrw),
			order.OrderName,
		)
		return nil
	})
	return result, err
}

func (s *Service) ConfirmPayment(ctx context.Context, user *auth.User, req ConfirmPaymentRequest) (ConfirmPaymentResult, error) {
	tx, err := s.repo.pool.Begin(ctx)
	if err != nil {
		return ConfirmPaymentResult{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := s.rateLimit.AssertRateLimit(ctx, tx, "confirm-payment:"+user.ID, 20, 60); err != nil {
		return ConfirmPaymentResult{}, err
	}

	orderID, err := shared.ParseUUID(req.OrderID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid order ID"))
	}

	payment, err := s.repo.GetPaymentByOrderID(ctx, tx, orderID)
	if err != nil {
		return ConfirmPaymentResult{}, err
	}
	if payment == nil {
		panic(apierrors.NotFound("Payment not found"))
	}
	if shared.UUIDToString(payment.CustomerID) != user.ID {
		panic(apierrors.Forbidden("You cannot confirm this payment"))
	}
	if int(payment.AmountKrw) != req.Amount {
		panic(apierrors.PaymentAmountMismatch("Payment amount does not match booking total"))
	}

	if payment.Status == "confirmed" {
		if err := tx.Commit(ctx); err != nil {
			return ConfirmPaymentResult{}, err
		}
		return ConfirmPaymentResult{
			PaymentID: shared.UUIDToString(payment.ID),
			OrderID:   shared.UUIDToString(payment.OrderID),
			BookingID: nil,
			Status:    "confirmed",
		}, nil
	}

	tossResponse, tossErr := s.toss.ConfirmPayment(req.PaymentKey, req.OrderID, req.Amount)
	if tossErr != nil {
		msg := tossErr.Error()
		if e, ok := tossErr.(*TossClientError); ok {
			msg = e.Message
		}
		_, _ = s.finalization.MarkPaymentFailed(ctx, tx, orderID, msg, tossResponse)
		if err := tx.Commit(ctx); err != nil {
			return ConfirmPaymentResult{}, err
		}
		panic(apierrors.PaymentFailed(msg))
	}

	if !IsSuccessful(tossResponse) {
		reason := fmt.Sprintf("%v", tossResponse["status"])
		if reason == "" || reason == "<nil>" {
			reason = "Payment not completed"
		}
		_, _ = s.finalization.MarkPaymentFailed(ctx, tx, orderID, reason, tossResponse)
		if err := tx.Commit(ctx); err != nil {
			return ConfirmPaymentResult{}, err
		}
		panic(apierrors.PaymentFailed("Payment was not completed"))
	}

	finalized, err := s.finalization.FinalizeSuccessfulPayment(ctx, tx, orderID, req.PaymentKey, req.Amount, tossResponse)
	if err != nil {
		return ConfirmPaymentResult{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return ConfirmPaymentResult{}, err
	}

	return mapConfirmPaymentResult(*finalized, nil), nil
}

func (s *Service) ReceiveWebhook(ctx context.Context, payload TossWebhookPayload) (WebhookAck, error) {
	if s.toss.IsDevMockEnabled() && !s.toss.HasSecretKey() {
		return WebhookAck{OK: true, Status: "ignored"}, nil
	}

	data := payload.Data
	if data == nil {
		panic(apierrors.BadRequest("Webhook payload missing paymentKey or orderId"))
	}

	paymentKey, _ := data["paymentKey"].(string)
	orderIDRaw, _ := data["orderId"].(string)
	if paymentKey == "" || orderIDRaw == "" {
		panic(apierrors.BadRequest("Webhook payload missing paymentKey or orderId"))
	}

	orderID, err := shared.ParseUUID(orderIDRaw)
	if err != nil {
		panic(apierrors.BadRequest("Webhook payload missing paymentKey or orderId"))
	}

	eventType := payload.EventType
	if eventType == "" {
		eventType = "UNKNOWN"
	}
	createdAt := payload.CreatedAt
	if createdAt == "" {
		createdAt = "unknown"
	}
	eventID := fmt.Sprintf("%s:%s:%s", eventType, paymentKey, createdAt)

	tx, err := s.repo.pool.Begin(ctx)
	if err != nil {
		return WebhookAck{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	payment, err := s.repo.GetPaymentByOrderID(ctx, tx, orderID)
	if err != nil {
		return WebhookAck{}, err
	}
	if payment == nil {
		panic(apierrors.NotFound("Payment not found"))
	}

	if err := s.finalization.RecordPaymentEvent(ctx, tx, eventID, payment.ID, payment.BookingID, eventType, map[string]any{
		"eventType": payload.EventType,
		"createdAt": payload.CreatedAt,
		"data":      payload.Data,
	}); err != nil {
		return WebhookAck{}, err
	}

	if payment.Status == "confirmed" {
		if err := tx.Commit(ctx); err != nil {
			return WebhookAck{}, err
		}
		return WebhookAck{OK: true, Status: "already_confirmed"}, nil
	}

	tossPayment, err := s.toss.FetchPayment(paymentKey)
	if err != nil {
		msg := err.Error()
		if e, ok := err.(*TossClientError); ok {
			msg = e.Message
		}
		panic(apierrors.ExternalServiceError(msg))
	}

	var ack WebhookAck
	if IsSuccessful(tossPayment) {
		amount := int(payment.AmountKrw)
		if v, ok := tossPayment["totalAmount"].(float64); ok {
			amount = int(v)
		}
		if _, err = s.finalization.FinalizeSuccessfulPayment(ctx, tx, orderID, paymentKey, amount, tossPayment); err != nil {
			return WebhookAck{}, err
		}
		ack = WebhookAck{OK: true, Status: "confirmed"}
	} else if IsFailed(tossPayment) {
		reason := fmt.Sprintf("%v", tossPayment["status"])
		if _, err = s.finalization.MarkPaymentFailed(ctx, tx, orderID, reason, tossPayment); err != nil {
			return WebhookAck{}, err
		}
		ack = WebhookAck{OK: true, Status: "failed"}
	} else {
		ack = WebhookAck{OK: true, Status: "ignored"}
	}

	if err := tx.Commit(ctx); err != nil {
		return WebhookAck{}, err
	}
	return ack, nil
}
