package authorization

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/contract"
	"github.com/housing-platform/backend-go/internal/db"
)

const apiPrefix = contract.APIPrefix

type mockAuthorizationQuerier struct {
	getProfile       func(context.Context, pgtype.UUID) (db.GetAuthProfileByIDRow, error)
	profileIsAdmin   func(context.Context, pgtype.UUID) (bool, error)
	getHostID        func(context.Context, pgtype.UUID) (pgtype.UUID, error)
	isHostOfProperty func(context.Context, db.IsHostOfPropertyParams) (bool, error)
	getBookingPropID func(context.Context, pgtype.UUID) (pgtype.UUID, error)
}

func (m *mockAuthorizationQuerier) GetAuthProfileByID(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
	if m.getProfile != nil {
		return m.getProfile(ctx, id)
	}
	return db.GetAuthProfileByIDRow{}, nil
}

func (m *mockAuthorizationQuerier) ProfileIsAdmin(ctx context.Context, id pgtype.UUID) (bool, error) {
	if m.profileIsAdmin != nil {
		return m.profileIsAdmin(ctx, id)
	}
	return false, nil
}

func (m *mockAuthorizationQuerier) GetHostIDForProfile(ctx context.Context, profileID pgtype.UUID) (pgtype.UUID, error) {
	if m.getHostID != nil {
		return m.getHostID(ctx, profileID)
	}
	return pgtype.UUID{}, nil
}

func (m *mockAuthorizationQuerier) IsHostOfProperty(ctx context.Context, arg db.IsHostOfPropertyParams) (bool, error) {
	if m.isHostOfProperty != nil {
		return m.isHostOfProperty(ctx, arg)
	}
	return false, nil
}

func (m *mockAuthorizationQuerier) GetBookingPropertyID(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error) {
	if m.getBookingPropID != nil {
		return m.getBookingPropID(ctx, id)
	}
	return pgtype.UUID{}, nil
}

func newAuthModule(t *testing.T, querier auth.AuthorizationQuerier) *auth.Module {
	t.Helper()
	return auth.NewTestModule(t, querier)
}

func customerAuthModule(t *testing.T, userID string) *auth.Module {
	t.Helper()

	profileID := mustParseUUID(t, userID)
	return newAuthModule(t, &mockAuthorizationQuerier{
		getProfile: func(_ context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
			return db.GetAuthProfileByIDRow{ID: profileID, Role: db.UserRoleCustomer}, nil
		},
		profileIsAdmin: func(_ context.Context, _ pgtype.UUID) (bool, error) {
			return false, nil
		},
	})
}

func newTestRouter(t *testing.T, mount func(r chi.Router, authModule *auth.Module)) http.Handler {
	t.Helper()

	authModule := newAuthModule(t, &mockAuthorizationQuerier{})
	router := chi.NewRouter()
	router.Use(apierrors.ErrorMiddleware)
	router.Route(apiPrefix, func(r chi.Router) {
		mount(r, authModule)
	})
	return router
}

func performRequest(handler http.Handler, method, path string, body []byte, token string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	var req *http.Request
	if body == nil {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	handler.ServeHTTP(rec, req)
	return rec
}

func decodeBody(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return body
}

func assertStatus(t *testing.T, rec *httptest.ResponseRecorder, want int) {
	t.Helper()
	if rec.Code != want {
		t.Fatalf("status = %d, want %d; body = %s", rec.Code, want, rec.Body.String())
	}
}

func assertErrorCode(t *testing.T, body map[string]any, code string) {
	t.Helper()

	if err := contract.AssertErrorEnvelope(body); err != nil {
		t.Fatalf("AssertErrorEnvelope() error = %v", err)
	}

	errorObj, ok := body["error"].(map[string]any)
	if !ok {
		t.Fatal("expected error object")
	}
	if errorObj["code"] != code {
		t.Fatalf("code = %v, want %s", errorObj["code"], code)
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
