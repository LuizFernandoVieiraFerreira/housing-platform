package payments

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
)

type FinalizationService struct{}

func NewFinalizationService() *FinalizationService {
	return &FinalizationService{}
}

func (s *FinalizationService) FinalizeSuccessfulPayment(
	ctx context.Context,
	q pgx.Tx,
	orderID pgtype.UUID,
	paymentKey string,
	amountKrw int,
	tossResponse map[string]any,
) (*db.Payment, error) {
	var payment db.Payment
	err := q.QueryRow(ctx, `
		SELECT id, order_id, payment_key, booking_id, customer_id, amount_krw, status,
		       toss_response, failed_reason, confirmed_at, created_at, updated_at
		FROM public.payments WHERE order_id = $1 FOR UPDATE
	`, orderID).Scan(
		&payment.ID, &payment.OrderID, &payment.PaymentKey, &payment.BookingID,
		&payment.CustomerID, &payment.AmountKrw, &payment.Status, &payment.TossResponse,
		&payment.FailedReason, &payment.ConfirmedAt, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.NotFound("Payment not found"))
		}
		return nil, err
	}

	if payment.Status == db.PaymentStatusConfirmed {
		return &payment, nil
	}

	if int(payment.AmountKrw) != amountKrw {
		panic(apierrors.PaymentAmountMismatch("Payment amount mismatch"))
	}

	var booking db.Booking
	err = q.QueryRow(ctx, `
		SELECT id, status, hold_expires_at FROM public.bookings WHERE id = $1 FOR UPDATE
	`, payment.BookingID).Scan(&booking.ID, &booking.Status, &booking.HoldExpiresAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.NotFound("Booking not found"))
		}
		return nil, err
	}

	tossJSON := marshalJSON(tossResponse)
	now := time.Now().UTC()

	if booking.Status == db.BookingStatusConfirmed {
		_, err = q.Exec(ctx, `
			UPDATE public.payments
			SET status = 'confirmed', payment_key = $2, toss_response = $3,
			    confirmed_at = COALESCE(confirmed_at, $4)
			WHERE order_id = $1
		`, orderID, paymentKey, tossJSON, now)
		if err != nil {
			return nil, err
		}
		payment.Status = db.PaymentStatusConfirmed
		payment.PaymentKey = &paymentKey
		return &payment, nil
	}

	if booking.Status != db.BookingStatusPendingPayment {
		panic(apierrors.BadRequest("Booking is not awaiting payment"))
	}

	if booking.HoldExpiresAt.Valid && !booking.HoldExpiresAt.Time.After(now) {
		_, _ = q.Exec(ctx, `UPDATE public.bookings SET status = 'expired' WHERE id = $1`, payment.BookingID)
		panic(apierrors.BookingExpired("Booking hold has expired"))
	}

	_, err = q.Exec(ctx, `
		UPDATE public.payments
		SET status = 'confirmed', payment_key = $2, toss_response = $3, confirmed_at = $4
		WHERE order_id = $1
	`, orderID, paymentKey, tossJSON, now)
	if err != nil {
		return nil, err
	}
	_, err = q.Exec(ctx, `UPDATE public.bookings SET status = 'confirmed' WHERE id = $1`, payment.BookingID)
	if err != nil {
		return nil, err
	}

	payment.Status = db.PaymentStatusConfirmed
	payment.PaymentKey = &paymentKey
	return &payment, nil
}

func (s *FinalizationService) MarkPaymentFailed(
	ctx context.Context,
	q pgx.Tx,
	orderID pgtype.UUID,
	reason string,
	tossResponse map[string]any,
) (*db.Payment, error) {
	var payment db.Payment
	err := q.QueryRow(ctx, `
		SELECT id, order_id, booking_id, status
		FROM public.payments WHERE order_id = $1 FOR UPDATE
	`, orderID).Scan(&payment.ID, &payment.OrderID, &payment.BookingID, &payment.Status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.NotFound("Payment not found"))
		}
		return nil, err
	}

	if payment.Status == db.PaymentStatusConfirmed {
		return &payment, nil
	}

	trimmed := strings.TrimSpace(reason)
	var failedReason *string
	if trimmed != "" {
		failedReason = &trimmed
	}

	tossJSON := marshalJSON(tossResponse)
	_, err = q.Exec(ctx, `
		UPDATE public.payments
		SET status = 'failed', failed_reason = $2, toss_response = $3
		WHERE order_id = $1
	`, orderID, failedReason, tossJSON)
	if err != nil {
		return nil, err
	}

	_, _ = q.Exec(ctx, `
		UPDATE public.bookings SET status = 'payment_failed'
		WHERE id = $1 AND status IN ('pending_payment', 'payment_failed')
	`, payment.BookingID)

	payment.Status = db.PaymentStatusFailed
	return &payment, nil
}

func (s *FinalizationService) RecordPaymentEvent(
	ctx context.Context,
	q pgx.Tx,
	eventID string,
	paymentID, bookingID pgtype.UUID,
	eventType string,
	payload map[string]any,
) error {
	payloadJSON := marshalJSON(payload)
	_, err := q.Exec(ctx, `
		INSERT INTO public.payment_events (event_id, payment_id, booking_id, event_type, payload)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (event_id) DO NOTHING
	`, eventID, paymentID, bookingID, eventType, payloadJSON)
	return err
}

func marshalJSON(value map[string]any) []byte {
	if value == nil {
		return nil
	}
	b, _ := json.Marshal(value)
	return b
}
