package profile

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

func (r *Repository) GetByID(ctx context.Context, q pgx.Tx, profileID pgtype.UUID) (*db.Profile, error) {
	var profile db.Profile
	err := q.QueryRow(ctx, `
		SELECT id, role, full_name, phone, avatar_url, preferred_language,
		       marketing_consent, deleted_at, created_at, updated_at
		FROM public.profiles
		WHERE id = $1 AND deleted_at IS NULL
	`, profileID).Scan(
		&profile.ID, &profile.Role, &profile.FullName, &profile.Phone, &profile.AvatarUrl,
		&profile.PreferredLanguage, &profile.MarketingConsent, &profile.DeletedAt,
		&profile.CreatedAt, &profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}

func (r *Repository) Update(ctx context.Context, q pgx.Tx, profileID pgtype.UUID, req UpdateProfileRequest) (*db.Profile, error) {
	phone := trimOptional(req.Phone)
	avatarURL := trimOptional(req.AvatarURL)

	var profile db.Profile
	err := q.QueryRow(ctx, `
		UPDATE public.profiles SET
		  full_name = $2,
		  phone = $3,
		  preferred_language = $4,
		  marketing_consent = $5,
		  avatar_url = $6
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, role, full_name, phone, avatar_url, preferred_language,
		          marketing_consent, deleted_at, created_at, updated_at
	`,
		profileID,
		strings.TrimSpace(req.FullName),
		phone,
		strings.TrimSpace(req.PreferredLanguage),
		req.MarketingConsent,
		avatarURL,
	).Scan(
		&profile.ID, &profile.Role, &profile.FullName, &profile.Phone, &profile.AvatarUrl,
		&profile.PreferredLanguage, &profile.MarketingConsent, &profile.DeletedAt,
		&profile.CreatedAt, &profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}

func trimOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
