package bookings

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

type bookingInputs struct {
	RoomID          pgtype.UUID
	PropertyID      pgtype.UUID
	BookingMode     string
	MinStayNights   int32
	MonthlyPriceKrw int32
	MaxOccupancy    int32
	Nights          int
}

type bookingListRow struct {
	ID            pgtype.UUID
	CustomerID    pgtype.UUID
	Status        string
	BookingType   string
	CheckIn       pgtype.Date
	CheckOut      pgtype.Date
	GuestCount    int32
	HoldExpiresAt pgtype.Timestamptz
	CreatedAt     pgtype.Timestamptz
	CustomerNotes *string
	PropertyID    pgtype.UUID
	RoomID        pgtype.UUID
	PropertyTitle string
	District      string
	RoomName      string
	RentKrw       int32
	ServiceFeeKrw int32
	TotalKrw      int32
	PricingVersion string
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ValidateBookingInputs(ctx context.Context, q pgx.Tx, roomID pgtype.UUID, checkIn, checkOut pgtype.Date, guestCount int) (bookingInputs, error) {
	if !checkOut.Valid || !checkIn.Valid || !checkOut.Time.After(checkIn.Time) {
		panic(apierrors.BadRequest("checkOut must be after checkIn"))
	}
	if guestCount <= 0 {
		panic(apierrors.BadRequest("guestCount must be positive"))
	}

	var room db.Room
	err := q.QueryRow(ctx, `
		SELECT id, property_id, max_occupancy, monthly_price_krw, available_from, status, deleted_at
		FROM public.rooms WHERE id = $1
	`, roomID).Scan(&room.ID, &room.PropertyID, &room.MaxOccupancy, &room.MonthlyPriceKrw, &room.AvailableFrom, &room.Status, &room.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.NotFound("Room is not available"))
		}
		return bookingInputs{}, err
	}
	if room.DeletedAt.Valid || room.Status != db.RoomStatusAvailable {
		panic(apierrors.NotFound("Room is not available"))
	}

	var property db.Property
	err = q.QueryRow(ctx, `
		SELECT id, min_stay_nights, booking_mode, status, deleted_at
		FROM public.properties WHERE id = $1
	`, room.PropertyID).Scan(&property.ID, &property.MinStayNights, &property.BookingMode, &property.Status, &property.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			panic(apierrors.NotFound("Property is not published"))
		}
		return bookingInputs{}, err
	}
	if property.DeletedAt.Valid || property.Status != db.PropertyStatusPublished {
		panic(apierrors.NotFound("Property is not published"))
	}

	nights := int(checkOut.Time.Sub(checkIn.Time).Hours() / 24)
	if nights < int(property.MinStayNights) {
		panic(apierrors.BadRequest("Stay must be at least " + itoa(int(property.MinStayNights)) + " nights"))
	}
	if guestCount > int(room.MaxOccupancy) {
		panic(apierrors.BadRequest("Room supports up to " + itoa(int(room.MaxOccupancy)) + " guests"))
	}
	if room.AvailableFrom.Valid && room.AvailableFrom.Time.After(checkIn.Time) {
		panic(apierrors.BadRequest("Room is not available from the selected check-in date"))
	}

	return bookingInputs{
		RoomID:          room.ID,
		PropertyID:      property.ID,
		BookingMode:     string(property.BookingMode),
		MinStayNights:   property.MinStayNights,
		MonthlyPriceKrw: room.MonthlyPriceKrw,
		MaxOccupancy:    room.MaxOccupancy,
		Nights:          nights,
	}, nil
}

func (r *Repository) RoomHasBookingConflict(ctx context.Context, q pgx.Tx, roomID pgtype.UUID, checkIn, checkOut pgtype.Date) (bool, error) {
	var exists bool
	err := q.QueryRow(ctx, `
		SELECT EXISTS (
		  SELECT 1 FROM public.bookings b
		  WHERE b.room_id = $1
		    AND b.status IN ('pending_payment', 'confirmed', 'active')
		    AND daterange(b.check_in, b.check_out, '[)') && daterange($2, $3, '[)')
		)
	`, roomID, checkIn, checkOut).Scan(&exists)
	return exists, err
}

func (r *Repository) CreateBookingHold(
	ctx context.Context,
	q pgx.Tx,
	customerID pgtype.UUID,
	inputs bookingInputs,
	checkIn, checkOut pgtype.Date,
	guestCount int,
	customerNotes *string,
	price shared.BookingPrice,
) (*db.Booking, error) {
	holdTTL, err := shared.NewPricingService(r.pool).GetHoldTTLMinutes(ctx, q)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	var status db.BookingStatus
	var bookingType db.BookingType
	var holdExpires pgtype.Timestamptz

	if inputs.BookingMode == "instant" {
		status = db.BookingStatusPendingPayment
		bookingType = db.BookingTypeInstant
		holdExpires = pgtype.Timestamptz{Time: now.Add(time.Duration(holdTTL) * time.Minute), Valid: true}
	} else {
		status = db.BookingStatusRequested
		bookingType = db.BookingTypeRequest
	}

	var booking db.Booking
	err = q.QueryRow(ctx, `
		INSERT INTO public.bookings (
		  customer_id, room_id, property_id, check_in, check_out, guest_count,
		  status, booking_type, hold_expires_at, customer_notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, customer_id, room_id, property_id, check_in, check_out, guest_count,
		          status, booking_type, hold_expires_at, customer_notes, approved_at, approved_by,
		          cancelled_at, created_at, updated_at, payment_retry_count
	`,
		customerID, inputs.RoomID, inputs.PropertyID, checkIn, checkOut, guestCount,
		status, bookingType, holdExpires, customerNotes,
	).Scan(
		&booking.ID, &booking.CustomerID, &booking.RoomID, &booking.PropertyID,
		&booking.CheckIn, &booking.CheckOut, &booking.GuestCount, &booking.Status,
		&booking.BookingType, &booking.HoldExpiresAt, &booking.CustomerNotes,
		&booking.ApprovedAt, &booking.ApprovedBy, &booking.CancelledAt,
		&booking.CreatedAt, &booking.UpdatedAt, &booking.PaymentRetryCount,
	)
	if err != nil {
		if isOverlapConflict(err) {
			panic(apierrors.Conflict("Selected dates conflict with an existing booking hold"))
		}
		return nil, err
	}

	breakdown, _ := json.Marshal([]map[string]any{{
		"nights":            inputs.Nights,
		"monthlyPriceKrw":   inputs.MonthlyPriceKrw,
		"rentKrw":           price.RentKrw,
		"serviceFeeKrw":     price.ServiceFeeKrw,
	}})

	_, err = q.Exec(ctx, `
		INSERT INTO public.booking_price_snapshots (
		  booking_id, rent_krw, service_fee_krw, utilities_krw, total_krw,
		  pricing_version, nightly_breakdown
		) VALUES ($1, $2, $3, 0, $4, $5, $6)
	`, booking.ID, price.RentKrw, price.ServiceFeeKrw, price.TotalKrw, price.PricingVersion, breakdown)
	if err != nil {
		if isOverlapConflict(err) {
			panic(apierrors.Conflict("Selected dates conflict with an existing booking hold"))
		}
		return nil, err
	}

	return &booking, nil
}

func (r *Repository) ListCustomerBookings(ctx context.Context, q pgx.Tx, customerID pgtype.UUID) ([]bookingListRow, error) {
	return r.queryBookingList(ctx, q, `
		WHERE b.customer_id = $1 ORDER BY b.created_at DESC
	`, customerID)
}

func (r *Repository) GetBookingDetailRow(ctx context.Context, q pgx.Tx, bookingID pgtype.UUID) (*bookingListRow, error) {
	rows, err := r.queryBookingList(ctx, q, `WHERE b.id = $1`, bookingID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}

func (r *Repository) GetBooking(ctx context.Context, q pgx.Tx, bookingID pgtype.UUID) (*db.Booking, error) {
	var booking db.Booking
	err := q.QueryRow(ctx, `
		SELECT id, customer_id, room_id, property_id, check_in, check_out, guest_count,
		       status, booking_type, hold_expires_at, customer_notes, approved_at, approved_by,
		       cancelled_at, created_at, updated_at, payment_retry_count
		FROM public.bookings WHERE id = $1
	`, bookingID).Scan(
		&booking.ID, &booking.CustomerID, &booking.RoomID, &booking.PropertyID,
		&booking.CheckIn, &booking.CheckOut, &booking.GuestCount, &booking.Status,
		&booking.BookingType, &booking.HoldExpiresAt, &booking.CustomerNotes,
		&booking.ApprovedAt, &booking.ApprovedBy, &booking.CancelledAt,
		&booking.CreatedAt, &booking.UpdatedAt, &booking.PaymentRetryCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &booking, nil
}

func (r *Repository) CancelBooking(ctx context.Context, q pgx.Tx, bookingID, customerID pgtype.UUID) (*db.Booking, error) {
	now := time.Now().UTC()
	var booking db.Booking
	err := q.QueryRow(ctx, `
		UPDATE public.bookings
		SET status = 'cancelled', cancelled_at = $3
		WHERE id = $1 AND customer_id = $2 AND status IN ('requested', 'pending_payment')
		RETURNING id, customer_id, room_id, property_id, check_in, check_out, guest_count,
		          status, booking_type, hold_expires_at, customer_notes, approved_at, approved_by,
		          cancelled_at, created_at, updated_at, payment_retry_count
	`, bookingID, customerID, now).Scan(
		&booking.ID, &booking.CustomerID, &booking.RoomID, &booking.PropertyID,
		&booking.CheckIn, &booking.CheckOut, &booking.GuestCount, &booking.Status,
		&booking.BookingType, &booking.HoldExpiresAt, &booking.CustomerNotes,
		&booking.ApprovedAt, &booking.ApprovedBy, &booking.CancelledAt,
		&booking.CreatedAt, &booking.UpdatedAt, &booking.PaymentRetryCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &booking, nil
}

func (r *Repository) ApproveBooking(ctx context.Context, q pgx.Tx, bookingID, approvedBy pgtype.UUID) (*db.Booking, error) {
	booking, err := r.GetBooking(ctx, q, bookingID)
	if err != nil || booking == nil || booking.Status != db.BookingStatusRequested {
		return nil, nil
	}

	conflict, err := r.RoomHasBookingConflict(ctx, q, booking.RoomID, booking.CheckIn, booking.CheckOut)
	if err != nil {
		return nil, err
	}
	if conflict {
		panic(apierrors.Conflict("Selected dates conflict with an existing booking hold"))
	}

	holdTTL, err := shared.NewPricingService(r.pool).GetHoldTTLMinutes(ctx, q)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	holdExpires := pgtype.Timestamptz{Time: now.Add(time.Duration(holdTTL) * time.Minute), Valid: true}

	err = q.QueryRow(ctx, `
		UPDATE public.bookings
		SET status = 'pending_payment', hold_expires_at = $2, approved_at = $3, approved_by = $4
		WHERE id = $1 AND status = 'requested'
		RETURNING id, customer_id, room_id, property_id, check_in, check_out, guest_count,
		          status, booking_type, hold_expires_at, customer_notes, approved_at, approved_by,
		          cancelled_at, created_at, updated_at, payment_retry_count
	`, bookingID, holdExpires, now, approvedBy).Scan(
		&booking.ID, &booking.CustomerID, &booking.RoomID, &booking.PropertyID,
		&booking.CheckIn, &booking.CheckOut, &booking.GuestCount, &booking.Status,
		&booking.BookingType, &booking.HoldExpiresAt, &booking.CustomerNotes,
		&booking.ApprovedAt, &booking.ApprovedBy, &booking.CancelledAt,
		&booking.CreatedAt, &booking.UpdatedAt, &booking.PaymentRetryCount,
	)
	if err != nil {
		if isOverlapConflict(err) {
			panic(apierrors.Conflict("Selected dates conflict with an existing booking hold"))
		}
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return booking, nil
}

func (r *Repository) RejectBooking(ctx context.Context, q pgx.Tx, bookingID pgtype.UUID) (*db.Booking, error) {
	var booking db.Booking
	err := q.QueryRow(ctx, `
		UPDATE public.bookings SET status = 'rejected'
		WHERE id = $1 AND status = 'requested'
		RETURNING id, customer_id, room_id, property_id, check_in, check_out, guest_count,
		          status, booking_type, hold_expires_at, customer_notes, approved_at, approved_by,
		          cancelled_at, created_at, updated_at, payment_retry_count
	`, bookingID).Scan(
		&booking.ID, &booking.CustomerID, &booking.RoomID, &booking.PropertyID,
		&booking.CheckIn, &booking.CheckOut, &booking.GuestCount, &booking.Status,
		&booking.BookingType, &booking.HoldExpiresAt, &booking.CustomerNotes,
		&booking.ApprovedAt, &booking.ApprovedBy, &booking.CancelledAt,
		&booking.CreatedAt, &booking.UpdatedAt, &booking.PaymentRetryCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &booking, nil
}

func (r *Repository) queryBookingList(ctx context.Context, q pgx.Tx, whereClause string, args ...any) ([]bookingListRow, error) {
	sql := `
		SELECT
		  b.id, b.customer_id, b.status::text, b.booking_type::text,
		  b.check_in, b.check_out, b.guest_count, b.hold_expires_at, b.created_at,
		  b.customer_notes, b.property_id, b.room_id,
		  p.title, p.district, r.name,
		  s.rent_krw, s.service_fee_krw, s.total_krw, s.pricing_version
		FROM public.bookings b
		JOIN public.properties p ON p.id = b.property_id
		JOIN public.rooms r ON r.id = b.room_id
		JOIN public.booking_price_snapshots s ON s.booking_id = b.id
	` + whereClause

	rows, err := q.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []bookingListRow
	for rows.Next() {
		var row bookingListRow
		if err := rows.Scan(
			&row.ID, &row.CustomerID, &row.Status, &row.BookingType,
			&row.CheckIn, &row.CheckOut, &row.GuestCount, &row.HoldExpiresAt, &row.CreatedAt,
			&row.CustomerNotes, &row.PropertyID, &row.RoomID,
			&row.PropertyTitle, &row.District, &row.RoomName,
			&row.RentKrw, &row.ServiceFeeKrw, &row.TotalKrw, &row.PricingVersion,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func isOverlapConflict(err error) bool {
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "bookings_no_overlap") || strings.Contains(msg, "exclusion")
}

func itoa(n int) string {
	return strconv.Itoa(n)
}
