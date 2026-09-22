package auth

import (
	"context"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/housing-platform/backend-go/internal/config"
)

// TestJWTSecret is the HS256 secret used by authorization and contract tests.
const TestJWTSecret = "super-secret-jwt-token-with-at-least-32-characters-long"

// TestTokenOptions configures signed JWT fixtures for HTTP tests.
type TestTokenOptions struct {
	UserID  string
	Role    string
	Expired bool
}

// NewTestJWTValidator returns a validator configured for local test tokens.
func NewTestJWTValidator(t *testing.T) *JWTValidator {
	t.Helper()

	validator, err := NewJWTValidator(context.Background(), &config.Config{
		SupabaseURL:         "http://127.0.0.1:54321",
		SupabaseJWTSecret:   TestJWTSecret,
		SupabaseJWTAudience: "authenticated",
	})
	if err != nil {
		t.Fatalf("NewJWTValidator() error = %v", err)
	}
	return validator
}

// NewTestModule wires JWT validation and authorization with the given querier.
func NewTestModule(t *testing.T, querier AuthorizationQuerier) *Module {
	t.Helper()

	return &Module{
		Validator:     NewTestJWTValidator(t),
		Authorization: NewAuthorizationService(querier),
	}
}

// MustSignTestToken returns a signed Supabase-style access token for tests.
func MustSignTestToken(t *testing.T, opts TestTokenOptions) string {
	t.Helper()

	userID := opts.UserID
	if userID == "" {
		userID = "22222222-2222-4222-8222-222222222222"
	}

	role := opts.Role
	if role == "" {
		role = "authenticated"
	}

	now := time.Now()
	exp := now.Add(time.Hour)
	if opts.Expired {
		exp = now.Add(-10 * time.Second)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"role":  role,
		"email": "test@example.com",
		"sub":   userID,
		"aud":   "authenticated",
		"iss":   "http://127.0.0.1:54321/auth/v1",
		"iat":   now.Unix(),
		"exp":   exp.Unix(),
	})

	signed, err := token.SignedString([]byte(TestJWTSecret))
	if err != nil {
		t.Fatalf("SignedString() error = %v", err)
	}
	return signed
}
