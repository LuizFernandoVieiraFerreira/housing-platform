package authorization

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/admin"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/bookings"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/contract"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/profile"
	"github.com/housing-platform/backend-go/internal/properties"
)

type adminRoute struct {
	method string
	path   string
	body   []byte
}

func adminRoutes() []adminRoute {
	id := uuid.NewString()
	return []adminRoute{
		{method: http.MethodGet, path: apiPrefix + "/admin/stats"},
		{method: http.MethodGet, path: apiPrefix + "/admin/properties"},
		{method: http.MethodPost, path: apiPrefix + "/admin/properties/" + id + "/publish"},
		{method: http.MethodPost, path: apiPrefix + "/admin/properties/" + id + "/reject"},
		{method: http.MethodPost, path: apiPrefix + "/admin/hosts/" + id + "/approve"},
		{method: http.MethodGet, path: apiPrefix + "/admin/audit-logs"},
		{
			method: http.MethodPatch,
			path:   apiPrefix + "/admin/housing-requests/" + id,
			body:   []byte(`{"status":"closed"}`),
		},
	}
}

func TestAdminRoutesRequireAuthentication(t *testing.T) {
	handler := newTestRouter(t, func(r chi.Router, authModule *auth.Module) {
		r.Mount("/admin", admin.Routes(&deps.Deps{Auth: authModule, Pool: nil}))
	})

	for _, route := range adminRoutes() {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			rec := performRequest(handler, route.method, route.path, route.body, "")
			assertStatus(t, rec, http.StatusUnauthorized)
			assertErrorCode(t, decodeBody(t, rec), apierrors.CodeUnauthenticated)
		})
	}
}

func TestNonAdminIsForbiddenFromAdminRoutes(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authModule := customerAuthModule(t, userID)
	token := auth.MustSignTestToken(t, auth.TestTokenOptions{UserID: userID})

	router := chi.NewRouter()
	router.Use(apierrors.ErrorMiddleware)
	router.Route(apiPrefix, func(r chi.Router) {
		r.Mount("/admin", admin.Routes(&deps.Deps{Auth: authModule, Pool: nil}))
	})

	for _, route := range adminRoutes() {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			rec := performRequest(router, route.method, route.path, route.body, token)
			assertStatus(t, rec, http.StatusForbidden)
			assertErrorCode(t, decodeBody(t, rec), apierrors.CodeForbidden)
		})
	}
}

func TestUnauthenticatedBookingsListIsRejected(t *testing.T) {
	handler := newTestRouter(t, func(r chi.Router, authModule *auth.Module) {
		r.Mount("/bookings", bookings.Routes(&deps.Deps{Auth: authModule, Pool: nil}))
	})

	rec := performRequest(handler, http.MethodGet, apiPrefix+"/bookings", nil, "")
	assertStatus(t, rec, http.StatusUnauthorized)
	assertErrorCode(t, decodeBody(t, rec), apierrors.CodeUnauthenticated)
}

func TestCustomerCannotApproveBooking(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authSvc := auth.NewAuthorizationService(&mockAuthorizationQuerier{
		profileIsAdmin: func(_ context.Context, _ pgtype.UUID) (bool, error) {
			return false, nil
		},
		getBookingPropID: func(_ context.Context, _ pgtype.UUID) (pgtype.UUID, error) {
			return pgtype.UUID{}, pgx.ErrNoRows
		},
		isHostOfProperty: func(_ context.Context, _ db.IsHostOfPropertyParams) (bool, error) {
			return false, nil
		},
	})

	svc := bookings.NewService(authSvc, nil, nil, nil)
	user := &auth.User{ID: userID, Email: "customer@example.com", Role: auth.RoleCustomer}

	assertPanicsWithCode(t, func() {
		_, _ = svc.ApproveBooking(context.Background(), user, uuid.NewString())
	}, apierrors.CodeForbidden)
}

func TestCustomerCannotSubmitPropertyForReview(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authSvc := auth.NewAuthorizationService(&mockAuthorizationQuerier{
		isHostOfProperty: func(_ context.Context, _ db.IsHostOfPropertyParams) (bool, error) {
			return false, nil
		},
	})

	svc := properties.NewService(&config.Config{}, authSvc, nil)
	user := &auth.User{ID: userID, Email: "customer@example.com", Role: auth.RoleCustomer}

	assertPanicsWithCode(t, func() {
		_, _ = svc.SubmitForReview(context.Background(), user, uuid.NewString())
	}, apierrors.CodeForbidden)
}

func TestCustomerCannotAccessAdminStats(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authSvc := auth.NewAuthorizationService(&mockAuthorizationQuerier{
		profileIsAdmin: func(_ context.Context, _ pgtype.UUID) (bool, error) {
			return false, nil
		},
	})

	svc := admin.NewService(authSvc, nil)
	user := &auth.User{ID: userID, Email: "customer@example.com", Role: auth.RoleCustomer}

	assertPanicsWithCode(t, func() {
		_, _ = svc.GetDashboardStats(context.Background(), user)
	}, apierrors.CodeForbidden)
}

func TestUpdateProfileRequestDoesNotAcceptRole(t *testing.T) {
	payload := map[string]any{
		"fullName":          "Jane Smith",
		"preferredLanguage": "en",
		"marketingConsent":  true,
		"role":              "admin",
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("Marshal() error = %v", err)
	}

	var req profile.UpdateProfileRequest
	if err := json.Unmarshal(raw, &req); err != nil {
		t.Fatalf("Unmarshal() error = %v", err)
	}

	encoded, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Marshal() error = %v", err)
	}

	if string(encoded) == "" {
		t.Fatal("expected encoded request")
	}

	var roundTrip map[string]any
	if err := json.Unmarshal(encoded, &roundTrip); err != nil {
		t.Fatalf("Unmarshal() error = %v", err)
	}
	if _, ok := roundTrip["role"]; ok {
		t.Fatal("role must not be accepted in update profile request")
	}
}

func TestContractErrorEnvelopeHelperMatchesForbiddenResponses(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authModule := customerAuthModule(t, userID)
	token := auth.MustSignTestToken(t, auth.TestTokenOptions{UserID: userID})

	router := chi.NewRouter()
	router.Use(apierrors.ErrorMiddleware)
	router.Route(apiPrefix, func(r chi.Router) {
		r.Mount("/admin", admin.Routes(&deps.Deps{Auth: authModule, Pool: nil}))
	})

	rec := performRequest(router, http.MethodGet, apiPrefix+"/admin/stats", nil, token)
	body := decodeBody(t, rec)
	if err := contract.AssertErrorEnvelope(body); err != nil {
		t.Fatalf("AssertErrorEnvelope() error = %v", err)
	}
}

func assertPanicsWithCode(t *testing.T, fn func(), code string) {
	t.Helper()

	defer func() {
		recovered := recover()
		if recovered == nil {
			t.Fatal("expected panic")
		}

		appErr, ok := recovered.(*apierrors.AppError)
		if !ok {
			t.Fatalf("expected AppError panic, got %T: %v", recovered, recovered)
		}
		if appErr.Code != code {
			t.Fatalf("code = %s, want %s", appErr.Code, code)
		}
	}()

	fn()
}
