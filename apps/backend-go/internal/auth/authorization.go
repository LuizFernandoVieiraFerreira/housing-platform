package auth

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
)

// AuthorizationQuerier defines auth-related database lookups.
type AuthorizationQuerier interface {
	GetAuthProfileByID(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error)
	ProfileIsAdmin(ctx context.Context, id pgtype.UUID) (bool, error)
	GetHostIDForProfile(ctx context.Context, profileID pgtype.UUID) (pgtype.UUID, error)
	IsHostOfProperty(ctx context.Context, arg db.IsHostOfPropertyParams) (bool, error)
	GetBookingPropertyID(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error)
}

// AuthorizationService mirrors Supabase SQL authorization helpers in the service layer.
type AuthorizationService struct {
	queries AuthorizationQuerier
}

// NewAuthorizationService creates an authorization service backed by sqlc queries.
func NewAuthorizationService(queries AuthorizationQuerier) *AuthorizationService {
	return &AuthorizationService{queries: queries}
}

// ResolveUser loads the authenticated user profile and role from the database.
func (s *AuthorizationService) ResolveUser(ctx context.Context, userID, email string) (*User, error) {
	id, err := parseUUID(userID)
	if err != nil {
		return nil, apierrors.Unauthorized("Access token is missing a valid subject")
	}

	profile, err := s.queries.GetAuthProfileByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apierrors.Unauthorized("User profile not found")
		}
		return nil, err
	}

	return &User{
		ID:    uuidToString(profile.ID),
		Email: email,
		Role:  string(profile.Role),
	}, nil
}

// IsAdmin checks whether the user has an active admin profile.
func (s *AuthorizationService) IsAdmin(ctx context.Context, userID string) (bool, error) {
	id, err := parseUUID(userID)
	if err != nil {
		return false, err
	}

	return s.queries.ProfileIsAdmin(ctx, id)
}

// GetHostIDForProfile returns the host ID linked to the profile, if any.
func (s *AuthorizationService) GetHostIDForProfile(ctx context.Context, userID string) (string, error) {
	id, err := parseUUID(userID)
	if err != nil {
		return "", err
	}

	hostID, err := s.queries.GetHostIDForProfile(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", err
	}

	return uuidToString(hostID), nil
}

// IsHostOfProperty checks whether the user owns the property via host linkage.
func (s *AuthorizationService) IsHostOfProperty(ctx context.Context, userID, propertyID string) (bool, error) {
	profileID, err := parseUUID(userID)
	if err != nil {
		return false, err
	}

	propID, err := parseUUID(propertyID)
	if err != nil {
		return false, err
	}

	return s.queries.IsHostOfProperty(ctx, db.IsHostOfPropertyParams{
		ID:        propID,
		ProfileID: profileID,
	})
}

// IsHostOfBooking checks whether the user hosts the booking's property.
func (s *AuthorizationService) IsHostOfBooking(ctx context.Context, userID, bookingID string) (bool, error) {
	bookingUUID, err := parseUUID(bookingID)
	if err != nil {
		return false, err
	}

	propertyID, err := s.queries.GetBookingPropertyID(ctx, bookingUUID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	return s.IsHostOfProperty(ctx, userID, uuidToString(propertyID))
}

// RequireAdmin rejects non-admin users.
func (s *AuthorizationService) RequireAdmin(ctx context.Context, user *User) error {
	isAdmin, err := s.IsAdmin(ctx, user.ID)
	if err != nil {
		return err
	}
	if !isAdmin {
		return apierrors.Forbidden("Admin access required")
	}
	return nil
}

// RequireHostOfProperty rejects users who do not host the property.
func (s *AuthorizationService) RequireHostOfProperty(ctx context.Context, user *User, propertyID string) error {
	isHost, err := s.IsHostOfProperty(ctx, user.ID, propertyID)
	if err != nil {
		return err
	}
	if !isHost {
		return apierrors.Forbidden("Only the host of this property can perform this action")
	}
	return nil
}

// RequireHostOfBooking rejects users who are neither admin nor host of the booking.
func (s *AuthorizationService) RequireHostOfBooking(ctx context.Context, user *User, bookingID string) error {
	isAdmin, err := s.IsAdmin(ctx, user.ID)
	if err != nil {
		return err
	}
	if isAdmin {
		return nil
	}

	isHost, err := s.IsHostOfBooking(ctx, user.ID, bookingID)
	if err != nil {
		return err
	}
	if !isHost {
		return apierrors.Forbidden("Only the host of this booking can perform this action")
	}
	return nil
}

func parseUUID(value string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(value); err != nil {
		return pgtype.UUID{}, err
	}
	return id, nil
}

func uuidToString(id pgtype.UUID) string {
	if !id.Valid {
		return ""
	}

	parsed, err := uuid.FromBytes(id.Bytes[:])
	if err != nil {
		return ""
	}

	return parsed.String()
}
