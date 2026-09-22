package contract

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/bookings"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/payments"
)

func TestCanonicalOpenAPIDocumentIsValid(t *testing.T) {
	document, err := LoadCanonicalOpenAPI()
	if err != nil {
		t.Fatalf("LoadCanonicalOpenAPI() error = %v", err)
	}

	if document["openapi"] != "3.1.0" {
		t.Fatalf("openapi = %v, want 3.1.0", document["openapi"])
	}

	path, err := CanonicalOpenAPIPath()
	if err != nil {
		t.Fatalf("CanonicalOpenAPIPath() error = %v", err)
	}
	if path == "" {
		t.Fatal("expected canonical OpenAPI path")
	}

	if _, ok := document["paths"].(map[string]any); !ok {
		t.Fatal("expected paths object in OpenAPI document")
	}
}

func TestChiExposesRequiredContractOperations(t *testing.T) {
	operations, err := ScanAppOperations(testAuthModule(t))
	if err != nil {
		t.Fatalf("ScanAppOperations() error = %v", err)
	}

	for _, operation := range RequiredOperations {
		if _, ok := operations[operation]; !ok {
			t.Errorf("missing %s %s in chi router", strings.ToUpper(operation.Method), operation.NormalizedPath)
		}
	}
}

func TestChiPathsAreDefinedInCanonicalContract(t *testing.T) {
	document, err := LoadCanonicalOpenAPI()
	if err != nil {
		t.Fatalf("LoadCanonicalOpenAPI() error = %v", err)
	}

	canonical := ListPathOperations(document)
	chiOps, err := ScanAppOperations(testAuthModule(t))
	if err != nil {
		t.Fatalf("ScanAppOperations() error = %v", err)
	}

	var undefined []string
	for key, path := range chiOps {
		if strings.HasSuffix(key.NormalizedPath, "/health") {
			continue
		}
		if _, ok := canonical[key]; !ok {
			undefined = append(undefined, strings.ToUpper(key.Method)+" "+path)
		}
	}

	if len(undefined) > 0 {
		t.Fatalf("chi exposes routes that are not in the canonical contract:\n%s", strings.Join(undefined, "\n"))
	}
}

func TestUnauthenticatedErrorMatchesContractEnvelope(t *testing.T) {
	server := newTestServer(t, testAuthModule(t))
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, APIPrefix+"/bookings", nil))

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}

	body := decodeJSONBody(t, rec)
	if err := AssertErrorEnvelope(body); err != nil {
		t.Fatalf("AssertErrorEnvelope() error = %v", err)
	}
	if body["error"].(map[string]any)["code"] != apierrors.CodeUnauthenticated {
		t.Fatalf("code = %v, want %s", body["error"], apierrors.CodeUnauthenticated)
	}
}

func TestValidationErrorMatchesContractEnvelope(t *testing.T) {
	userID := "11111111-1111-4111-8111-111111111111"
	authModule := testAuthModuleForUser(t, userID, db.UserRoleCustomer)
	server := newTestServer(t, authModule)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, APIPrefix+"/payments/orders", bytes.NewBufferString("not-json"))
	req.Header.Set("Authorization", "Bearer "+auth.MustSignTestToken(t, auth.TestTokenOptions{UserID: userID}))
	req.Header.Set("Content-Type", "application/json")
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	body := decodeJSONBody(t, rec)
	if err := AssertErrorEnvelope(body); err != nil {
		t.Fatalf("AssertErrorEnvelope() error = %v", err)
	}
	if body["error"].(map[string]any)["code"] != apierrors.CodeValidationError {
		t.Fatalf("code = %v, want %s", body["error"], apierrors.CodeValidationError)
	}
}

func TestRequiredOperationKeysAlignWithScannerHelper(t *testing.T) {
	if len(RequiredOperations) == 0 {
		t.Fatal("expected required operations to be defined")
	}
}

func testAuthModule(t *testing.T) *auth.Module {
	t.Helper()
	return auth.NewTestModule(t, &noopAuthorizationQuerier{})
}

func testAuthModuleForUser(t *testing.T, userID string, role db.UserRole) *auth.Module {
	t.Helper()

	profileID := mustParseUUID(t, userID)
	return auth.NewTestModule(t, &noopAuthorizationQuerier{
		getProfile: func(_ context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
			return db.GetAuthProfileByIDRow{ID: profileID, Role: role}, nil
		},
	})
}

func newTestServer(t *testing.T, authModule *auth.Module) http.Handler {
	t.Helper()

	router := chi.NewRouter()
	router.Use(apierrors.ErrorMiddleware)
	router.Route(APIPrefix, func(r chi.Router) {
		r.Mount("/bookings", bookings.Routes(&deps.Deps{Auth: authModule, Pool: nil}))
		r.Mount("/payments", payments.Routes(&deps.Deps{
			Auth: authModule,
			Pool: nil,
			Config: &config.Config{
				APIPrefix: APIPrefix,
			},
		}))
	})

	return router
}

func decodeJSONBody(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return body
}

type noopAuthorizationQuerier struct {
	getProfile func(context.Context, pgtype.UUID) (db.GetAuthProfileByIDRow, error)
}

func (q *noopAuthorizationQuerier) GetAuthProfileByID(ctx context.Context, id pgtype.UUID) (db.GetAuthProfileByIDRow, error) {
	if q.getProfile != nil {
		return q.getProfile(ctx, id)
	}
	return db.GetAuthProfileByIDRow{}, nil
}

func (q *noopAuthorizationQuerier) ProfileIsAdmin(context.Context, pgtype.UUID) (bool, error) {
	return false, nil
}

func (q *noopAuthorizationQuerier) GetHostIDForProfile(context.Context, pgtype.UUID) (pgtype.UUID, error) {
	return pgtype.UUID{}, nil
}

func (q *noopAuthorizationQuerier) IsHostOfProperty(context.Context, db.IsHostOfPropertyParams) (bool, error) {
	return false, nil
}

func (q *noopAuthorizationQuerier) GetBookingPropertyID(context.Context, pgtype.UUID) (pgtype.UUID, error) {
	return pgtype.UUID{}, nil
}

func mustParseUUID(t *testing.T, value string) pgtype.UUID {
	t.Helper()

	var id pgtype.UUID
	if err := id.Scan(value); err != nil {
		t.Fatalf("parse uuid %q: %v", value, err)
	}
	return id
}
