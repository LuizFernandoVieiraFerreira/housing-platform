// Package auth provides JWT validation and authorization for the Go backend.
//
// REST backends connect with service credentials and bypass RLS.
// Authorization is enforced in the service layer, not via PostgreSQL RLS.
package auth

import (
	"context"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	RoleCustomer = "customer"
	RoleHost     = "host"
	RoleAdmin    = "admin"
)

// User represents the authenticated user extracted from JWT and profile lookup.
type User struct {
	ID    string // Supabase Auth user ID (UUID)
	Email string
	Role  string // From profiles table: customer, host, admin
}

type contextKey string

const userKey contextKey = "authUser"

// GetUser retrieves the authenticated user from context.
// Returns nil if no user is authenticated.
func GetUser(ctx context.Context) *User {
	if user, ok := ctx.Value(userKey).(*User); ok {
		return user
	}
	return nil
}

// SetUser stores the authenticated user in context.
func SetUser(ctx context.Context, user *User) context.Context {
	return context.WithValue(ctx, userKey, user)
}

// RequireUser returns the authenticated user or panics with an unauthorized error.
// Use in handlers that require authentication.
func RequireUser(ctx context.Context) *User {
	user := GetUser(ctx)
	if user == nil {
		panic(apierrors.Unauthorized("Authentication required"))
	}
	return user
}

// NewModule wires JWT validation and authorization services.
func NewModule(ctx context.Context, pool *pgxpool.Pool, cfg *config.Config) (*Module, error) {
	validator, err := NewJWTValidator(ctx, cfg)
	if err != nil {
		return nil, err
	}

	queries := db.New(pool)
	return &Module{
		Validator:     validator,
		Authorization: NewAuthorizationService(queries),
	}, nil
}

// Authorization helpers - equivalent to RLS helper functions.

// IsAdmin checks if the user has admin role from the resolved profile.
func IsAdmin(user *User) bool {
	return user != nil && user.Role == RoleAdmin
}

// IsHost checks if the user has host role from the resolved profile.
func IsHost(user *User) bool {
	return user != nil && user.Role == RoleHost
}

// RequireAdmin panics if the user is not an admin based on resolved profile role.
func RequireAdmin(ctx context.Context) *User {
	user := RequireUser(ctx)
	if !IsAdmin(user) {
		panic(apierrors.Forbidden("Admin access required"))
	}
	return user
}
