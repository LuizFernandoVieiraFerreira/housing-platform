package payments

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

type paymentLookupRow struct {
	ID         pgtype.UUID
	OrderID    pgtype.UUID
	BookingID  pgtype.UUID
	CustomerID pgtype.UUID
	AmountKrw  int32
	Status     string
}

type paymentOrderRow struct {
	PaymentID pgtype.UUID
	OrderID   pgtype.UUID
	BookingID pgtype.UUID
	AmountKrw int32
	OrderName string
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetPaymentByOrderID(ctx context.Context, q pgx.Tx, orderID pgtype.UUID) (*paymentLookupRow, error) {
	var row paymentLookupRow
	err := q.QueryRow(ctx, `
		SELECT id, order_id, booking_id, customer_id, amount_krw, status::text
		FROM public.payments WHERE order_id = $1
	`, orderID).Scan(&row.ID, &row.OrderID, &row.BookingID, &row.CustomerID, &row.AmountKrw, &row.Status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *Repository) CreatePaymentOrder(ctx context.Context, q pgx.Tx, bookingID, customerID pgtype.UUID) (paymentOrderRow, error) {
	var booking db.Booking
	err := q.QueryRow(ctx, `
		SELECT id, customer_id, status, hold_expires_at, payment_retry_count, property_id
		FROM public.bookings WHERE id = $1 FOR UPDATE
	`, bookingID).Scan(&booking.ID, &booking.CustomerID, &booking.Status, &booking.HoldExpiresAt, &booking.PaymentRetryCount, &booking.PropertyID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.Forbidden("Booking not found"))
		}
		return paymentOrderRow{}, err
	}
	if shared.UUIDToString(booking.CustomerID) != shared.UUIDToString(customerID) {
		panic(apierrors.Forbidden("Booking not found"))
	}

	now := time.Now().UTC()

	if booking.Status == db.BookingStatusPaymentFailed {
		if booking.PaymentRetryCount >= 1 {
			panic(apierrors.BadRequest("Payment retry limit reached"))
		}
		holdTTL, err := shared.NewPricingService(r.pool).GetHoldTTLMinutes(ctx, q)
		if err != nil {
			return paymentOrderRow{}, err
		}
		holdExpires := pgtype.Timestamptz{Time: now.Add(time.Duration(holdTTL) * time.Minute), Valid: true}
		_, err = q.Exec(ctx, `
			UPDATE public.bookings
			SET status = 'pending_payment', payment_retry_count = payment_retry_count + 1, hold_expires_at = $2
			WHERE id = $1
		`, bookingID, holdExpires)
		if err != nil {
			return paymentOrderRow{}, err
		}
	} else if booking.Status != db.BookingStatusPendingPayment {
		panic(apierrors.Forbidden("Booking is not awaiting payment"))
	}

	if booking.HoldExpiresAt.Valid && !booking.HoldExpiresAt.Time.After(now) {
		_, _ = q.Exec(ctx, `UPDATE public.bookings SET status = 'expired' WHERE id = $1`, bookingID)
		panic(apierrors.BookingExpired("Booking hold has expired"))
	}

	var totalKrw int32
	err = q.QueryRow(ctx, `
		SELECT total_krw FROM public.booking_price_snapshots WHERE booking_id = $1
	`, bookingID).Scan(&totalKrw)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.BadRequest("Booking price snapshot missing"))
		}
		return paymentOrderRow{}, err
	}

	var propertyTitle *string
	_ = q.QueryRow(ctx, `SELECT title FROM public.properties WHERE id = $1`, booking.PropertyID).Scan(&propertyTitle)

	orderName := "Housing Platform stay"
	if propertyTitle != nil && *propertyTitle != "" {
		orderName = *propertyTitle
	}

	orderUUID := uuid.New()
	var paymentID pgtype.UUID
	err = q.QueryRow(ctx, `
		INSERT INTO public.payments (order_id, booking_id, customer_id, amount_krw, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id
	`, orderUUID, bookingID, customerID, totalKrw).Scan(&paymentID)
	if err != nil {
		return paymentOrderRow{}, err
	}

	var orderID pgtype.UUID
	_ = orderID.Scan(orderUUID.String())

	return paymentOrderRow{
		PaymentID: paymentID,
		OrderID:   orderID,
		BookingID: bookingID,
		AmountKrw: totalKrw,
		OrderName: orderName,
	}, nil
}
