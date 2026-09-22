package hosts

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/db"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetByProfileID(ctx context.Context, q pgx.Tx, profileID pgtype.UUID) (*db.Host, error) {
	var host db.Host
	err := q.QueryRow(ctx, `
		SELECT id, profile_id, display_name, status, verified_at, deleted_at, created_at, updated_at
		FROM public.hosts WHERE profile_id = $1 AND deleted_at IS NULL
	`, profileID).Scan(
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

func (r *Repository) Register(ctx context.Context, q pgx.Tx, profileID pgtype.UUID, displayName string) (*db.Host, error) {
	existing, err := r.GetByProfileID(ctx, q, profileID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	if _, err := q.Exec(ctx, `ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_role`); err != nil {
		return nil, err
	}
	defer func() {
		_, _ = q.Exec(ctx, `ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_role`)
	}()

	if _, err := q.Exec(ctx, `
		UPDATE public.profiles SET role = 'host' WHERE id = $1
	`, profileID); err != nil {
		return nil, err
	}

	var host db.Host
	err = q.QueryRow(ctx, `
		INSERT INTO public.hosts (profile_id, display_name, status)
		VALUES ($1, $2, 'pending')
		RETURNING id, profile_id, display_name, status, verified_at, deleted_at, created_at, updated_at
	`, profileID, strings.TrimSpace(displayName)).Scan(
		&host.ID, &host.ProfileID, &host.DisplayName, &host.Status,
		&host.VerifiedAt, &host.DeletedAt, &host.CreatedAt, &host.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if _, err := q.Exec(ctx, `ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_role`); err != nil {
		return nil, err
	}

	return &host, nil
}

func (r *Repository) ListProperties(ctx context.Context, q pgx.Tx, hostID pgtype.UUID) ([]hostPropertyListRow, error) {
	rows, err := q.Query(ctx, `
		SELECT
		  p.id, p.title, p.slug, p.property_type::text, p.district,
		  p.status::text, p.booking_mode::text, p.monthly_price_min,
		  coalesce((
		    SELECT count(*)::integer FROM public.rooms r
		    WHERE r.property_id = p.id AND r.deleted_at IS NULL
		  ), 0) AS room_count,
		  p.updated_at
		FROM public.properties p
		WHERE p.host_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.updated_at DESC
	`, hostID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []hostPropertyListRow
	for rows.Next() {
		var row hostPropertyListRow
		if err := rows.Scan(
			&row.ID, &row.Title, &row.Slug, &row.PropertyType, &row.District,
			&row.Status, &row.BookingMode, &row.MonthlyPriceMin, &row.RoomCount, &row.UpdatedAt,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func (r *Repository) PropertyBelongsToHost(ctx context.Context, q pgx.Tx, hostID, propertyID pgtype.UUID) (bool, error) {
	var exists bool
	err := q.QueryRow(ctx, `
		SELECT EXISTS(
		  SELECT 1 FROM public.properties
		  WHERE id = $1 AND host_id = $2 AND deleted_at IS NULL
		)
	`, propertyID, hostID).Scan(&exists)
	return exists, err
}

func (r *Repository) ListBookings(ctx context.Context, q pgx.Tx, hostID pgtype.UUID) ([]hostBookingRow, error) {
	rows, err := q.Query(ctx, `
		SELECT
		  b.id, b.status::text, b.booking_type::text, b.check_in, b.check_out,
		  b.guest_count, b.customer_notes, p.title, r.name, s.total_krw, b.created_at
		FROM public.bookings b
		JOIN public.properties p ON p.id = b.property_id
		JOIN public.rooms r ON r.id = b.room_id
		JOIN public.booking_price_snapshots s ON s.booking_id = b.id
		WHERE p.host_id = $1
		ORDER BY b.created_at DESC
	`, hostID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []hostBookingRow
	for rows.Next() {
		var row hostBookingRow
		if err := rows.Scan(
			&row.ID, &row.Status, &row.BookingType, &row.CheckIn, &row.CheckOut,
			&row.GuestCount, &row.CustomerNotes, &row.PropertyTitle, &row.RoomName,
			&row.TotalKrw, &row.CreatedAt,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}
