package bookings

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	repo          *Repository
	auth          *auth.AuthorizationService
	pricing       *shared.PricingService
	notifications *NotificationService
	rateLimit     *shared.RateLimitService
}

func NewService(authSvc *auth.AuthorizationService, repo *Repository, pricing *shared.PricingService, rateLimit *shared.RateLimitService) *Service {
	return &Service{
		repo:          repo,
		auth:          authSvc,
		pricing:       pricing,
		notifications: NewNotificationService(),
		rateLimit:     rateLimit,
	}
}

func (s *Service) Quote(ctx context.Context, query BookingQuoteQuery, rateLimitActor string) (BookingQuote, error) {
	var quote BookingQuote
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		if err := s.rateLimit.AssertRateLimit(ctx, tx, "quote:"+rateLimitActor, 60, 60); err != nil {
			return err
		}

		roomID := mustParseUUID(query.RoomID, "Invalid room ID")
		checkIn := mustParseDate(query.CheckIn)
		checkOut := mustParseDate(query.CheckOut)

		inputs, err := s.repo.ValidateBookingInputs(ctx, tx, roomID, checkIn, checkOut, query.GuestCount)
		if err != nil {
			return err
		}

		price, err := s.pricing.CalculatePrice(ctx, int(inputs.MonthlyPriceKrw), inputs.Nights)
		if err != nil {
			return err
		}

		quote = mapBookingQuote(
			shared.UUIDToString(inputs.RoomID),
			shared.UUIDToString(inputs.PropertyID),
			inputs.BookingMode,
			price,
			inputs.Nights,
		)
		return nil
	})
	return quote, err
}

func (s *Service) ListMyBookings(ctx context.Context, user *auth.User) ([]BookingListItem, error) {
	customerID := mustParseUUID(user.ID, "Invalid user ID")
	var items []BookingListItem
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListCustomerBookings(ctx, tx, customerID)
		if err != nil {
			return err
		}
		items = make([]BookingListItem, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapBookingListItem(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) GetBookingDetail(ctx context.Context, user *auth.User, bookingID string) (BookingDetail, error) {
	id := mustParseUUID(bookingID, "Invalid booking ID")
	var detail BookingDetail
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		row, err := s.repo.GetBookingDetailRow(ctx, tx, id)
		if err != nil {
			return err
		}
		if row == nil {
			panic(apierrors.NotFound("Booking not found"))
		}
		s.requireBookingAccess(ctx, user, shared.UUIDToString(row.PropertyID), shared.UUIDToString(row.CustomerID))
		detail = mapBookingDetail(*row)
		return nil
	})
	return detail, err
}

func (s *Service) CreateBookingHold(ctx context.Context, user *auth.User, req CreateBookingRequest) (Booking, error) {
	var result Booking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		if err := s.rateLimit.AssertRateLimit(ctx, tx, "booking_hold:"+user.ID, 10, 60); err != nil {
			return err
		}

		roomID := mustParseUUID(req.RoomID, "Invalid room ID")
		checkIn := mustParseDate(req.CheckIn)
		checkOut := mustParseDate(req.CheckOut)

		inputs, err := s.repo.ValidateBookingInputs(ctx, tx, roomID, checkIn, checkOut, req.GuestCount)
		if err != nil {
			return err
		}

		conflict, err := s.repo.RoomHasBookingConflict(ctx, tx, roomID, checkIn, checkOut)
		if err != nil {
			return err
		}
		if conflict {
			panic(apierrors.Conflict("Selected dates conflict with an existing booking hold"))
		}

		price, err := s.pricing.CalculatePrice(ctx, int(inputs.MonthlyPriceKrw), inputs.Nights)
		if err != nil {
			return err
		}

		customerNotes := req.CustomerNotes
		if customerNotes != nil {
			trimmed := strings.TrimSpace(*customerNotes)
			if trimmed == "" {
				customerNotes = nil
			} else {
				customerNotes = &trimmed
			}
		}

		customerID := mustParseUUID(user.ID, "Invalid user ID")
		booking, err := s.repo.CreateBookingHold(ctx, tx, customerID, inputs, checkIn, checkOut, req.GuestCount, customerNotes, price)
		if err != nil {
			return err
		}

		if inputs.BookingMode == "request" {
			s.notifications.NotifyBookingRequest(ctx, tx, *booking)
		}

		result = mapBooking(*booking)
		return nil
	})
	return result, err
}

func (s *Service) CancelBooking(ctx context.Context, user *auth.User, bookingID string) (Booking, error) {
	id := mustParseUUID(bookingID, "Invalid booking ID")
	customerID := mustParseUUID(user.ID, "Invalid user ID")

	var result Booking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		booking, err := s.repo.GetBooking(ctx, tx, id)
		if err != nil {
			return err
		}
		if booking == nil {
			panic(apierrors.NotFound("Booking not found"))
		}
		if shared.UUIDToString(booking.CustomerID) != user.ID {
			panic(apierrors.Forbidden("Cannot cancel this booking"))
		}

		cancelled, err := s.repo.CancelBooking(ctx, tx, id, customerID)
		if err != nil {
			return err
		}
		if cancelled == nil {
			panic(apierrors.BadRequest("Booking cannot be cancelled"))
		}

		result = mapBooking(*cancelled)
		return nil
	})
	return result, err
}

func (s *Service) ApproveBooking(ctx context.Context, user *auth.User, bookingID string) (Booking, error) {
	id := mustParseUUID(bookingID, "Invalid booking ID")
	if err := s.auth.RequireHostOfBooking(ctx, user, bookingID); err != nil {
		panic(err)
	}

	var result Booking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		approvedBy := mustParseUUID(user.ID, "Invalid user ID")
		approved, err := s.repo.ApproveBooking(ctx, tx, id, approvedBy)
		if err != nil {
			return err
		}
		if approved == nil {
			panic(apierrors.BadRequest("Booking must be in requested status to approve"))
		}

		s.notifications.NotifyBookingConfirmed(ctx, tx, *approved)
		result = mapBooking(*approved)
		return nil
	})
	return result, err
}

func (s *Service) RejectBooking(ctx context.Context, user *auth.User, bookingID string) (Booking, error) {
	id := mustParseUUID(bookingID, "Invalid booking ID")
	if err := s.auth.RequireHostOfBooking(ctx, user, bookingID); err != nil {
		panic(err)
	}

	var result Booking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rejected, err := s.repo.RejectBooking(ctx, tx, id)
		if err != nil {
			return err
		}
		if rejected == nil {
			panic(apierrors.BadRequest("Booking must be in requested status to reject"))
		}

		s.notifications.NotifyBookingRejected(ctx, tx, *rejected)
		result = mapBooking(*rejected)
		return nil
	})
	return result, err
}

func (s *Service) requireBookingAccess(ctx context.Context, user *auth.User, propertyID, customerID string) {
	if customerID == user.ID {
		return
	}
	isAdmin, err := s.auth.IsAdmin(ctx, user.ID)
	if err != nil {
		panic(apierrors.InternalError("Failed to check admin status"))
	}
	if isAdmin {
		return
	}
	isHost, err := s.auth.IsHostOfProperty(ctx, user.ID, propertyID)
	if err != nil {
		panic(apierrors.InternalError("Failed to check host ownership"))
	}
	if !isHost {
		panic(apierrors.Forbidden("Booking not found"))
	}
}

func mustParseUUID(value, message string) pgtype.UUID {
	id, err := shared.ParseUUID(value)
	if err != nil {
		panic(apierrors.BadRequest(message))
	}
	return id
}

func mustParseDate(value string) pgtype.Date {
	d, err := shared.ParseDate(value)
	if err != nil {
		panic(apierrors.BadRequest("Invalid date"))
	}
	return d
}
