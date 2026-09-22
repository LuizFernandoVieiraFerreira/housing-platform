package errors

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAppError_Error(t *testing.T) {
	err := New(CodeBadRequest, "test message", http.StatusBadRequest)
	if err.Error() != "test message" {
		t.Errorf("expected 'test message', got %s", err.Error())
	}
}

func TestAppError_StatusCode(t *testing.T) {
	err := New(CodeNotFound, "not found", http.StatusNotFound)
	if err.StatusCode() != http.StatusNotFound {
		t.Errorf("expected %d, got %d", http.StatusNotFound, err.StatusCode())
	}
}

func TestAppError_WithDetails(t *testing.T) {
	err := BadRequest("validation failed").WithDetails(map[string]any{
		"field": "email",
		"error": "invalid format",
	})

	if err.Details["field"] != "email" {
		t.Errorf("expected field 'email', got %v", err.Details["field"])
	}
}

func TestErrorConstructors(t *testing.T) {
	tests := []struct {
		name       string
		err        *AppError
		wantCode   string
		wantStatus int
	}{
		{"BadRequest", BadRequest("bad"), CodeBadRequest, http.StatusBadRequest},
		{"Unauthorized", Unauthorized("unauth"), CodeUnauthorized, http.StatusUnauthorized},
		{"Forbidden", Forbidden("forbidden"), CodeForbidden, http.StatusForbidden},
		{"NotFound", NotFound("not found"), CodeNotFound, http.StatusNotFound},
		{"Conflict", Conflict("conflict"), CodeConflict, http.StatusConflict},
		{"UnprocessableEntity", UnprocessableEntity("invalid"), CodeUnprocessableEntity, http.StatusUnprocessableEntity},
		{"InternalError", InternalError("internal"), CodeInternalError, http.StatusInternalServerError},
		{"ServiceUnavailable", ServiceUnavailable("unavailable"), CodeServiceUnavailable, http.StatusServiceUnavailable},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.Code != tt.wantCode {
				t.Errorf("code: expected %s, got %s", tt.wantCode, tt.err.Code)
			}
			if tt.err.StatusCode() != tt.wantStatus {
				t.Errorf("status: expected %d, got %d", tt.wantStatus, tt.err.StatusCode())
			}
		})
	}
}

func TestWriteError(t *testing.T) {
	rec := httptest.NewRecorder()
	err := NotFound("resource not found")

	WriteError(rec, err)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type 'application/json', got %s", contentType)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error.Code != CodeNotFound {
		t.Errorf("expected code %s, got %s", CodeNotFound, resp.Error.Code)
	}
}

func TestFromError(t *testing.T) {
	t.Run("returns AppError unchanged", func(t *testing.T) {
		original := Forbidden("no access")
		result := FromError(original)
		if result != original {
			t.Error("expected same AppError instance")
		}
	})

	t.Run("wraps standard error as internal", func(t *testing.T) {
		original := errors.New("some error")
		result := FromError(original)
		if result.Code != CodeInternalError {
			t.Errorf("expected code %s, got %s", CodeInternalError, result.Code)
		}
	})
}
