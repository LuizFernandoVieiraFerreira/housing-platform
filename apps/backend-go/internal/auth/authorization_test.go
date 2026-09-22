package auth

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
)

type mockAuthorizationQuerier struct {
	getProfile        func(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error)
	profileIsAdmin    func(ctx context.Context, id pgtype.UUID) (bool, error)
	getHostID         func(ctx context.Context, profileID pgtype.UUID) (pgtype.UUID, error)
	isHostOfProperty  func(ctx context.Context, arg db.IsHostOfPropertyParams) (bool, error)
	getBookingPropID  func(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error)
}

func (m *mockAuthorizationQuerier) GetAuthProfileByID(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
	return m.getProfile(ctx, id)
}

func (m *mockAuthorizationQuerier) ProfileIsAdmin(ctx context.Context, id pgtype.UUID) (bool, error) {
	return m.profileIsAdmin(ctx, id)
}

func (m *mockAuthorizationQuerier) GetHostIDForProfile(ctx context.Context, profileID pgtype.UUID) (pgtype.UUID, error) {
	return m.getHostID(ctx, profileID)
}

func (m *mockAuthorizationQuerier) IsHostOfProperty(ctx context.Context, arg db.IsHostOfPropertyParams) (bool, error) {
	return m.isHostOfProperty(ctx, arg)
}

func (m *mockAuthorizationQuerier) GetBookingPropertyID(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error) {
	return m.getBookingPropID(ctx, id)
}

func TestAuthorizationServiceResolveUser(t *testing.T) {
	profileID := mustParseUUID(t, "11111111-1111-4111-8111-111111111111")
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		getProfile: func(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
			return db.GetAuthProfileByIDRow{
				ID:   profileID,
				Role: db.UserRoleHost,
			}, nil
		},
	})

	user, err := service.ResolveUser(context.Background(), profileID.String(), "host@example.com")
	if err != nil {
		t.Fatalf("ResolveUser() error = %v", err)
	}

	if user.ID != profileID.String() {
		t.Fatalf("ID = %q, want %q", user.ID, profileID.String())
	}
	if user.Email != "host@example.com" {
		t.Fatalf("Email = %q, want host@example.com", user.Email)
	}
	if user.Role != RoleHost {
		t.Fatalf("Role = %q, want %q", user.Role, RoleHost)
	}
}

func TestAuthorizationServiceResolveUserMissingProfile(t *testing.T) {
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		getProfile: func(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
			return db.GetAuthProfileByIDRow{}, pgx.ErrNoRows
		},
	})

	_, err := service.ResolveUser(context.Background(), "11111111-1111-4111-8111-111111111111", "")
	assertAppError(t, err, apierrors.CodeUnauthorized, "User profile not found")
}

func TestAuthorizationServiceRequireAdmin(t *testing.T) {
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		profileIsAdmin: func(ctx context.Context, id pgtype.UUID) (bool, error) {
			return false, nil
		},
	})

	user := &User{
		ID:    "11111111-1111-4111-8111-111111111111",
		Email: "user@example.com",
		Role:  RoleCustomer,
	}

	err := service.RequireAdmin(context.Background(), user)
	assertAppError(t, err, apierrors.CodeForbidden, "Admin access required")
}

func TestAuthorizationServiceGetHostIDForProfile(t *testing.T) {
	hostID := mustParseUUID(t, "33333333-3333-4333-8333-333333333333")
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		getHostID: func(ctx context.Context, profileID pgtype.UUID) (pgtype.UUID, error) {
			return hostID, nil
		},
	})

	got, err := service.GetHostIDForProfile(context.Background(), "11111111-1111-4111-8111-111111111111")
	if err != nil {
		t.Fatalf("GetHostIDForProfile() error = %v", err)
	}
	if got != hostID.String() {
		t.Fatalf("host ID = %q, want %q", got, hostID.String())
	}
}

func TestAuthorizationServiceIsHostOfBookingMissingBooking(t *testing.T) {
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		getBookingPropID: func(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error) {
			return pgtype.UUID{}, pgx.ErrNoRows
		},
	})

	isHost, err := service.IsHostOfBooking(context.Background(), "11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222")
	if err != nil {
		t.Fatalf("IsHostOfBooking() error = %v", err)
	}
	if isHost {
		t.Fatal("expected false for missing booking")
	}
}

func TestAuthorizationServiceRequireHostOfBookingAllowsAdmin(t *testing.T) {
	service := NewAuthorizationService(&mockAuthorizationQuerier{
		profileIsAdmin: func(ctx context.Context, id pgtype.UUID) (bool, error) {
			return true, nil
		},
	})

	user := &User{
		ID:    "11111111-1111-4111-8111-111111111111",
		Email: "admin@example.com",
		Role:  RoleAdmin,
	}

	if err := service.RequireHostOfBooking(context.Background(), user, "22222222-2222-4222-8222-222222222222"); err != nil {
		t.Fatalf("RequireHostOfBooking() error = %v", err)
	}
}

func mustParseUUID(t *testing.T, value string) pgtype.UUID {
	t.Helper()

	var id pgtype.UUID
	if err := id.Scan(value); err != nil {
		t.Fatalf("parse uuid %q: %v", value, err)
	}
	return id
}

func assertAppError(t *testing.T, err error, code, message string) {
	t.Helper()

	var appErr *apierrors.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected AppError, got %T: %v", err, err)
	}
	if appErr.Code != code {
		t.Fatalf("code = %q, want %q", appErr.Code, code)
	}
	if appErr.Message != message {
		t.Fatalf("message = %q, want %q", appErr.Message, message)
	}
}
