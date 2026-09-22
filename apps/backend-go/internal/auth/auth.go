// Package auth provides JWT validation and authorization for the Go backend.
//
// REST backends connect with service credentials and bypass RLS.
// Authorization is enforced in the service layer, not via PostgreSQL RLS.
package auth

import (
	"context"
	"net/http"
)

// User represents the authenticated user extracted from JWT.
type User struct {
	ID    string // Supabase Auth user ID (UUID)
	Email string
	Role  string // From profiles table: "user", "host", "admin"
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
		panic("unauthorized: no authenticated user")
	}
	return user
}

// Middleware placeholder - to be implemented with JWT validation.
// TODO: Implement JWT validation using Supabase JWKS or HS256 secret.
func Middleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// TODO: Extract and validate JWT from Authorization header
			// TODO: Load user role from profiles table
			// TODO: Set user in context
			next.ServeHTTP(w, r)
		})
	}
}

// Authorization helpers - equivalent to RLS helper functions.

// IsAdmin checks if the user has admin role.
func IsAdmin(user *User) bool {
	return user != nil && user.Role == "admin"
}

// IsHost checks if the user has host role.
func IsHost(user *User) bool {
	return user != nil && user.Role == "host"
}

// RequireAdmin panics if the user is not an admin.
func RequireAdmin(ctx context.Context) *User {
	user := RequireUser(ctx)
	if !IsAdmin(user) {
		panic("forbidden: admin role required")
	}
	return user
}
