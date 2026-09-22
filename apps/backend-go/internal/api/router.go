package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/api/health"
	"github.com/housing-platform/backend-go/internal/config"
)

// NewRouter creates the main chi router with all routes configured.
func NewRouter(pool *pgxpool.Pool, cfg *config.Config) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(errors.ErrorMiddleware)

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// API routes
	r.Route(cfg.APIPrefix, func(r chi.Router) {
		// Health check (public)
		r.Get("/health", health.Handler(pool))

		// Feature routes - mount with auth.NewModule(ctx, pool, cfg):
		// r.With(authModule.Required()).Route("/bookings", bookings.Routes(pool, cfg))
		// r.With(authModule.Optional()).Route("/properties", properties.Routes(pool, cfg))
		// r.With(authModule.Required()).Route("/payments", payments.Routes(pool, cfg))
		// r.With(authModule.Required()).Route("/hosts", hosts.Routes(pool, cfg))
		// r.With(authModule.RequireAdmin()).Route("/admin", admin.Routes(pool, cfg))
		// r.With(authModule.Required()).Route("/notifications", notifications.Routes(pool, cfg))
		// r.With(authModule.Required()).Route("/profile", profile.Routes(pool, cfg))
	})

	return r
}
