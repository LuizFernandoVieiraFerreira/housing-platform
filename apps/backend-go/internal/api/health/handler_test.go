package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandler_ResponseFormat(t *testing.T) {
	// Note: This test verifies response format without a real database.
	// Integration tests with a real database should be in tests/integration/.

	// Create a handler with nil pool (will report degraded status)
	handler := Handler(nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	handler(rec, req)

	// Should still return valid JSON even when database is unavailable
	var resp Response
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	// Without a database, status should be degraded
	if resp.Status != "degraded" {
		t.Errorf("expected status 'degraded', got %s", resp.Status)
	}

	if resp.Database != false {
		t.Errorf("expected database false, got %v", resp.Database)
	}

	// Should return 503 when database is down
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status code %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}

	// Verify Content-Type header
	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type 'application/json', got %s", contentType)
	}
}
