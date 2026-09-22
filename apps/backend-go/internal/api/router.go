package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/housing-platform/backend-go/internal/admin"
	"github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/api/health"
	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/bookings"
	"github.com/housing-platform/backend-go/internal/hosts"
	"github.com/housing-platform/backend-go/internal/notifications"
	"github.com/housing-platform/backend-go/internal/payments"
	"github.com/housing-platform/backend-go/internal/profile"
	"github.com/housing-platform/backend-go/internal/properties"
)

// NewRouter creates the main chi router with all routes configured.
func NewRouter(d *deps.Deps) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(errors.ErrorMiddleware)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   d.Config.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route(d.Config.APIPrefix, func(r chi.Router) {
		r.Get("/health", health.Handler(d.Pool))

		r.Mount("/properties", properties.Routes(d))
		r.Mount("/amenities", properties.AmenitiesRoutes(d))
		r.Mount("/rooms", properties.RoomRoutes(d))
		r.Mount("/bookings", bookings.Routes(d))
		r.Mount("/payments", payments.Routes(d))
		r.Mount("/hosts", hosts.Routes(d))
		r.Mount("/admin", admin.Routes(d))
		r.Mount("/notifications", notifications.Routes(d))
		r.Mount("/profile", profile.Routes(d))
	})

	return r
}
