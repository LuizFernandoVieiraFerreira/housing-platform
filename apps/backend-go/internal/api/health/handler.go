package health

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/db"
)

// Response is the health check response body.
type Response struct {
	Status   string `json:"status"`
	Database bool   `json:"database"`
}

// Handler returns an http.HandlerFunc that performs health checks.
func Handler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		dbOK := false
		if pool != nil {
			result, err := db.New(pool).HealthCheck(ctx)
			dbOK = err == nil && result == 1
		}

		status := "ok"
		if !dbOK {
			status = "degraded"
		}

		resp := Response{
			Status:   status,
			Database: dbOK,
		}

		w.Header().Set("Content-Type", "application/json")
		if !dbOK {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		json.NewEncoder(w).Encode(resp)
	}
}
