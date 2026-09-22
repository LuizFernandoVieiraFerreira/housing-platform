package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/config"
)

const testJWTSecret = "super-secret-jwt-token-with-at-least-32-characters-long"

func TestJWTValidatorValidate(t *testing.T) {
	validator := newTestJWTValidator(t)
	userID := "11111111-1111-4111-8111-111111111111"

	token := mustSignToken(t, signTokenOptions{userID: userID})

	claims, err := validator.Validate(token)
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}

	if claims.UserID != userID {
		t.Fatalf("UserID = %q, want %q", claims.UserID, userID)
	}
	if claims.Email != "test@example.com" {
		t.Fatalf("Email = %q, want test@example.com", claims.Email)
	}
}

func TestJWTValidatorRejectsExpiredToken(t *testing.T) {
	validator := newTestJWTValidator(t)
	token := mustSignToken(t, signTokenOptions{expired: true})

	_, err := validator.Validate(token)
	assertUnauthorized(t, err, "Invalid or expired access token")
}

func TestJWTValidatorRejectsServiceRoleToken(t *testing.T) {
	validator := newTestJWTValidator(t)
	token := mustSignToken(t, signTokenOptions{role: "service_role"})

	_, err := validator.Validate(token)
	assertUnauthorized(t, err, "Access token is not for an authenticated user")
}

func TestJWTValidatorRejectsAnonToken(t *testing.T) {
	validator := newTestJWTValidator(t)
	token := mustSignToken(t, signTokenOptions{role: "anon"})

	_, err := validator.Validate(token)
	assertUnauthorized(t, err, "Access token is not for an authenticated user")
}

func TestJWTValidatorRequiresSecretForHS256(t *testing.T) {
	validator := newTestJWTValidatorWithoutSecret(t)
	token := mustSignToken(t, signTokenOptions{})

	_, err := validator.Validate(token)
	assertUnauthorized(t, err, "Invalid or expired access token")
}

type signTokenOptions struct {
	userID  string
	role    string
	expired bool
}

func newTestJWTValidator(t *testing.T) *JWTValidator {
	t.Helper()
	validator, err := NewJWTValidator(context.Background(), &config.Config{
		SupabaseURL:         "http://127.0.0.1:54321",
		SupabaseJWTSecret:   testJWTSecret,
		SupabaseJWTAudience: "authenticated",
	})
	if err != nil {
		t.Fatalf("NewJWTValidator() error = %v", err)
	}
	return validator
}

func newTestJWTValidatorWithoutSecret(t *testing.T) *JWTValidator {
	t.Helper()
	validator, err := NewJWTValidator(context.Background(), &config.Config{
		SupabaseURL:         "http://127.0.0.1:54321",
		SupabaseJWTSecret:   "",
		SupabaseJWTAudience: "authenticated",
	})
	if err != nil {
		t.Fatalf("NewJWTValidator() error = %v", err)
	}
	return validator
}

func mustSignToken(t *testing.T, opts signTokenOptions) string {
	t.Helper()

	userID := opts.userID
	if userID == "" {
		userID = "22222222-2222-4222-8222-222222222222"
	}

	role := opts.role
	if role == "" {
		role = "authenticated"
	}

	now := time.Now()
	exp := now.Add(time.Hour)
	if opts.expired {
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

	signed, err := token.SignedString([]byte(testJWTSecret))
	if err != nil {
		t.Fatalf("SignedString() error = %v", err)
	}
	return signed
}

func assertUnauthorized(t *testing.T, err error, message string) {
	t.Helper()

	var appErr *apierrors.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected AppError, got %T: %v", err, err)
	}
	if appErr.Code != apierrors.CodeUnauthorized {
		t.Fatalf("code = %q, want %q", appErr.Code, apierrors.CodeUnauthorized)
	}
	if appErr.Message != message {
		t.Fatalf("message = %q, want %q", appErr.Message, message)
	}
}
