package bookings

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

const dateFormat = "Jan 02, 2006"

type NotificationService struct{}

func NewNotificationService() *NotificationService {
	return &NotificationService{}
}

func (s *NotificationService) NotifyBookingRequest(ctx context.Context, q pgx.Tx, booking db.Booking) {
	property, hostProfileID := s.loadPropertyHost(ctx, q, booking.PropertyID)
	if property == nil || !hostProfileID.Valid {
		return
	}

	guestName := s.guestName(ctx, q, booking.CustomerID)
	body := fmt.Sprintf("%s requested to stay at %s (%s – %s)",
		guestName, property.Title,
		formatDate(booking.CheckIn), formatDate(booking.CheckOut))

	s.createNotification(ctx, q, hostProfileID, "booking_request", "New booking request", body, booking.ID)
}

func (s *NotificationService) NotifyBookingConfirmed(ctx context.Context, q pgx.Tx, booking db.Booking) {
	property, _ := s.loadPropertyHost(ctx, q, booking.PropertyID)
	if property == nil || !s.profileExists(ctx, q, booking.CustomerID) {
		return
	}

	hostName := s.hostDisplayName(ctx, q, property.HostID)
	body := fmt.Sprintf("%s confirmed your booking for %s, %s – %s",
		hostName, property.Title,
		formatDate(booking.CheckIn), formatDate(booking.CheckOut))

	s.createNotification(ctx, q, booking.CustomerID, "booking_confirmed", "Booking confirmed", body, booking.ID)
}

func (s *NotificationService) NotifyBookingRejected(ctx context.Context, q pgx.Tx, booking db.Booking) {
	property, _ := s.loadPropertyHost(ctx, q, booking.PropertyID)
	if property == nil || !s.profileExists(ctx, q, booking.CustomerID) {
		return
	}

	body := fmt.Sprintf("Your request to stay at %s (%s – %s) was declined",
		property.Title, formatDate(booking.CheckIn), formatDate(booking.CheckOut))

	s.createNotification(ctx, q, booking.CustomerID, "booking_rejected", "Booking request declined", body, booking.ID)
}

type propertyHostInfo struct {
	Title  string
	HostID pgtype.UUID
}

func (s *NotificationService) loadPropertyHost(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*propertyHostInfo, pgtype.UUID) {
	var info propertyHostInfo
	var hostProfileID pgtype.UUID
	err := q.QueryRow(ctx, `
		SELECT p.title, p.host_id, h.profile_id
		FROM public.properties p
		JOIN public.hosts h ON h.id = p.host_id
		WHERE p.id = $1
	`, propertyID).Scan(&info.Title, &info.HostID, &hostProfileID)
	if err != nil {
		return nil, pgtype.UUID{}
	}
	return &info, hostProfileID
}

func (s *NotificationService) guestName(ctx context.Context, q pgx.Tx, customerID pgtype.UUID) string {
	var fullName *string
	err := q.QueryRow(ctx, `
		SELECT full_name FROM public.profiles
		WHERE id = $1 AND deleted_at IS NULL
	`, customerID).Scan(&fullName)
	if err != nil || fullName == nil || *fullName == "" {
		return "A guest"
	}
	return *fullName
}

func (s *NotificationService) hostDisplayName(ctx context.Context, q pgx.Tx, hostID pgtype.UUID) string {
	var displayName *string
	err := q.QueryRow(ctx, `
		SELECT display_name FROM public.hosts WHERE id = $1 AND deleted_at IS NULL
	`, hostID).Scan(&displayName)
	if err != nil || displayName == nil || *displayName == "" {
		return "Your host"
	}
	return *displayName
}

func (s *NotificationService) profileExists(ctx context.Context, q pgx.Tx, profileID pgtype.UUID) bool {
	var exists bool
	_ = q.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = $1 AND deleted_at IS NULL)
	`, profileID).Scan(&exists)
	return exists
}

func (s *NotificationService) createNotification(ctx context.Context, q pgx.Tx, userID pgtype.UUID, notifType, title, body string, bookingID pgtype.UUID) {
	metadata, _ := json.Marshal(map[string]string{
		"bookingId": shared.UUIDToString(bookingID),
	})
	_, _ = q.Exec(ctx, `
		INSERT INTO public.notifications (user_id, type, title, body, metadata)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, notifType, title, body, metadata)
}

func formatDate(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format(dateFormat)
}
