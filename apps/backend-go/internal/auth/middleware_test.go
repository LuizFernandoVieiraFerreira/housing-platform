package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/db"
)

func TestRequiredMiddlewareRejectsMissingToken(t *testing.T) {
	module := testAuthModule(t)
	handler := module.Required()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not run")
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/protected", nil))

	assertErrorResponse(t, rec, apierrors.CodeUnauthenticated, "Authentication required")
}

func TestRequiredMiddlewareAttachesUser(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	module := testAuthModule(t)
	handler := module.Required()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := GetUser(r.Context())
		if user == nil {
			t.Fatal("expected user in context")
		}
		if user.ID != userID {
			t.Fatalf("user ID = %q, want %q", user.ID, userID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	token := mustSignToken(t, signTokenOptions{userID: userID})
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestOptionalMiddlewareAllowsAnonymousAccess(t *testing.T) {
	module := testAuthModule(t)
	handler := module.Optional()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if GetUser(r.Context()) != nil {
			t.Fatal("expected no user in context")
		}
		w.WriteHeader(http.StatusOK)
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/public", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestOptionalMiddlewareResolvesUserWhenTokenPresent(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	module := testAuthModule(t)
	handler := module.Optional()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := GetUser(r.Context())
		if user == nil || user.ID != userID {
			t.Fatalf("expected user %q in context", userID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	token := mustSignToken(t, signTokenOptions{userID: userID})
	req := httptest.NewRequest(http.MethodGet, "/public", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func testAuthModule(t *testing.T) *Module {
	t.Helper()

	profileID := mustParseUUID(t, "11111111-1111-4111-8111-111111111111")
	validator := newTestJWTValidator(t)
	authorization := NewAuthorizationService(&mockAuthorizationQuerier{
		getProfile: func(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
			return db.GetAuthProfileByIDRow{
				ID:   profileID,
				Role: db.UserRoleCustomer,
			}, nil
		},
	})

	return &Module{
		Validator:     validator,
		Authorization: authorization,
	}
}

func assertErrorResponse(t *testing.T, rec *httptest.ResponseRecorder, code, message string) {
	t.Helper()

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}

	var resp apierrors.ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Error == nil {
		t.Fatal("expected error body")
	}
	if resp.Error.Code != code {
		t.Fatalf("code = %q, want %q", resp.Error.Code, code)
	}
	if resp.Error.Message != message {
		t.Fatalf("message = %q, want %q", resp.Error.Message, message)
	}
}
