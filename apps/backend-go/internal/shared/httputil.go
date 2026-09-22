package shared

import (
	"encoding/json"
	"net/http"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
)

func DecodeJSON(r *http.Request, dst any) {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		panic(apierrors.BadRequest("Request validation failed"))
	}
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		panic(apierrors.InternalError("Failed to encode response"))
	}
}

func MustUUID(value string, message string) string {
	if value == "" {
		panic(apierrors.BadRequest(message))
	}
	return value
}
