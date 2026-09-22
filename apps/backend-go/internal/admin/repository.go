package admin

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/hosts"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetDashboardStats(ctx context.Context, q pgx.Tx) (AdminDashboardStats, error) {
	var stats AdminDashboardStats
	err := q.QueryRow(ctx, `
		SELECT
		  (SELECT count(*)::integer FROM public.properties WHERE status = 'pending_review' AND deleted_at IS NULL),
		  (SELECT count(*)::integer FROM public.hosts WHERE status = 'pending' AND deleted_at IS NULL),
		  (SELECT count(*)::integer FROM public.bookings WHERE status IN ('requested', 'pending_payment', 'payment_failed')),
		  (SELECT count(*)::integer FROM public.housing_requests WHERE status IN ('new', 'in_progress'))
	`).Scan(&stats.PendingProperties, &stats.PendingHosts, &stats.OpenBookings, &stats.OpenHousingRequests)
	return stats, err
}

func (r *Repository) ListProperties(ctx context.Context, q pgx.Tx) ([]adminPropertyRow, error) {
	rows, err := q.Query(ctx, `
		SELECT
		  p.id, p.title, p.slug, p.property_type::text, p.district,
		  p.status::text, p.booking_mode::text, p.monthly_price_min,
		  coalesce((
		    SELECT count(*)::integer FROM public.rooms r
		    WHERE r.property_id = p.id AND r.deleted_at IS NULL
		  ), 0),
		  p.updated_at, h.display_name
		FROM public.properties p
		JOIN public.hosts h ON h.id = p.host_id
		WHERE p.deleted_at IS NULL
		ORDER BY p.updated_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []adminPropertyRow
	for rows.Next() {
		var row adminPropertyRow
		if err := rows.Scan(
			&row.ID, &row.Title, &row.Slug, &row.PropertyType, &row.District,
			&row.Status, &row.BookingMode, &row.MonthlyPriceMin, &row.RoomCount,
			&row.UpdatedAt, &row.HostDisplayName,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) PublishProperty(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*db.Property, error) {
	var id pgtype.UUID
	err := q.QueryRow(ctx, `
		UPDATE public.properties
		SET status = 'published', published_at = timezone('utc', now())
		WHERE id = $1 AND deleted_at IS NULL AND status = 'pending_review'
		RETURNING id
	`, propertyID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.getPropertyByID(ctx, q, id)
}

func (r *Repository) RejectPropertyReview(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*db.Property, error) {
	var id pgtype.UUID
	err := q.QueryRow(ctx, `
		UPDATE public.properties SET status = 'draft'
		WHERE id = $1 AND deleted_at IS NULL AND status = 'pending_review'
		RETURNING id
	`, propertyID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.getPropertyByID(ctx, q, id)
}

func (r *Repository) getPropertyByID(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*db.Property, error) {
	var prop db.Property
	err := q.QueryRow(ctx, `
		SELECT id, title, slug, status FROM public.properties WHERE id = $1
	`, propertyID).Scan(&prop.ID, &prop.Title, &prop.Slug, &prop.Status)
	if err != nil {
		return nil, err
	}
	return &prop, nil
}

func (r *Repository) ListHosts(ctx context.Context, q pgx.Tx) ([]adminHostRow, error) {
	rows, err := q.Query(ctx, `
		SELECT h.id, h.display_name, h.status::text, p.full_name, h.verified_at, h.created_at
		FROM public.hosts h
		JOIN public.profiles p ON p.id = h.profile_id
		WHERE h.deleted_at IS NULL
		ORDER BY h.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []adminHostRow
	for rows.Next() {
		var row adminHostRow
		if err := rows.Scan(&row.ID, &row.DisplayName, &row.Status, &row.ProfileName, &row.VerifiedAt, &row.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) ApproveHost(ctx context.Context, q pgx.Tx, hostID pgtype.UUID) (*db.Host, error) {
	var host db.Host
	err := q.QueryRow(ctx, `
		UPDATE public.hosts
		SET status = 'active', verified_at = timezone('utc', now())
		WHERE id = $1 AND deleted_at IS NULL AND status = 'pending'
		RETURNING id, profile_id, display_name, status, verified_at, deleted_at, created_at, updated_at
	`, hostID).Scan(
		&host.ID, &host.ProfileID, &host.DisplayName, &host.Status,
		&host.VerifiedAt, &host.DeletedAt, &host.CreatedAt, &host.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &host, nil
}

func (r *Repository) ListBookings(ctx context.Context, q pgx.Tx) ([]hosts.HostBooking, error) {
	rows, err := q.Query(ctx, `
		SELECT
		  b.id, b.status::text, b.booking_type::text, b.check_in, b.check_out,
		  b.guest_count, b.customer_notes, p.title, r.name, s.total_krw, b.created_at
		FROM public.bookings b
		JOIN public.properties p ON p.id = b.property_id
		JOIN public.rooms r ON r.id = b.room_id
		JOIN public.booking_price_snapshots s ON s.booking_id = b.id
		ORDER BY b.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []hosts.HostBooking
	for rows.Next() {
		var id pgtype.UUID
		var status, bookingType, propertyTitle, roomName string
		var checkIn, checkOut pgtype.Date
		var guestCount int32
		var customerNotes *string
		var totalKrw int32
		var createdAt pgtype.Timestamptz
		if err := rows.Scan(
			&id, &status, &bookingType, &checkIn, &checkOut,
			&guestCount, &customerNotes, &propertyTitle, &roomName, &totalKrw, &createdAt,
		); err != nil {
			return nil, err
		}
		results = append(results, hosts.MapHostBookingRow(id, status, bookingType, checkIn, checkOut, guestCount, customerNotes, propertyTitle, roomName, totalKrw, createdAt))
	}
	return results, rows.Err()
}

func (r *Repository) ListPayments(ctx context.Context, q pgx.Tx) ([]adminPaymentRow, error) {
	rows, err := q.Query(ctx, `
		SELECT pay.id, pay.order_id, pay.booking_id, pay.amount_krw, pay.status::text,
		       pay.confirmed_at, pay.created_at, prop.title, prof.full_name
		FROM public.payments pay
		JOIN public.bookings b ON b.id = pay.booking_id
		JOIN public.properties prop ON prop.id = b.property_id
		JOIN public.profiles prof ON prof.id = pay.customer_id
		ORDER BY pay.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []adminPaymentRow
	for rows.Next() {
		var row adminPaymentRow
		if err := rows.Scan(
			&row.ID, &row.OrderID, &row.BookingID, &row.AmountKrw, &row.Status,
			&row.ConfirmedAt, &row.CreatedAt, &row.PropertyTitle, &row.CustomerName,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) ListHousingRequests(ctx context.Context, q pgx.Tx) ([]housingRequestRow, error) {
	rows, err := q.Query(ctx, `
		SELECT id, email, desired_area, check_in, check_out, budget_max,
		       accommodation_type::text, notes, status::text, created_at
		FROM public.housing_requests
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []housingRequestRow
	for rows.Next() {
		var row housingRequestRow
		if err := rows.Scan(
			&row.ID, &row.Email, &row.DesiredArea, &row.CheckIn, &row.CheckOut,
			&row.BudgetMax, &row.AccommodationType, &row.Notes, &row.Status, &row.CreatedAt,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) UpdateHousingRequestStatus(ctx context.Context, q pgx.Tx, requestID pgtype.UUID, status string) (*housingRequestRow, error) {
	var row housingRequestRow
	err := q.QueryRow(ctx, `
		UPDATE public.housing_requests SET status = $2
		WHERE id = $1
		RETURNING id, email, desired_area, check_in, check_out, budget_max,
		          accommodation_type::text, notes, status::text, created_at
	`, requestID, status).Scan(
		&row.ID, &row.Email, &row.DesiredArea, &row.CheckIn, &row.CheckOut,
		&row.BudgetMax, &row.AccommodationType, &row.Notes, &row.Status, &row.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *Repository) ListAuditLogs(ctx context.Context, q pgx.Tx, limit int) ([]auditLogRow, error) {
	rows, err := q.Query(ctx, `
		SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at, p.full_name
		FROM public.audit_logs a
		JOIN public.profiles p ON p.id = a.actor_id
		ORDER BY a.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []auditLogRow
	for rows.Next() {
		var row auditLogRow
		if err := rows.Scan(&row.ID, &row.Action, &row.EntityType, &row.EntityID, &row.Metadata, &row.CreatedAt, &row.ActorName); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) WriteAuditLog(ctx context.Context, q pgx.Tx, actorID pgtype.UUID, action, entityType string, entityID pgtype.UUID, metadata map[string]any) error {
	metaJSON, _ := json.Marshal(metadata)
	_, err := q.Exec(ctx, `
		INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
		VALUES ($1, $2, $3, $4, $5)
	`, actorID, action, entityType, entityID, metaJSON)
	return err
}
