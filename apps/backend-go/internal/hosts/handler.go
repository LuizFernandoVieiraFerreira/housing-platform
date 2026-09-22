package hosts

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/properties"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Handler struct {
	svc *Service
}

func NewHandler(d *deps.Deps) *Handler {
	return &Handler{
		svc: NewService(
			d.Auth.Authorization,
			NewRepository(d.Pool),
			properties.NewRepository(d.Pool),
		),
	}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()
	r.Use(d.Auth.Required())

	r.Post("/", h.Register)
	r.Get("/me", h.GetCurrentHost)
	r.Get("/me/properties", h.ListProperties)
	r.Get("/me/properties/{propertyID}", h.GetProperty)
	r.Get("/me/bookings", h.ListBookings)

	return r
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req RegisterHostRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.Register(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) GetCurrentHost(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.GetCurrentHost(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListProperties(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListProperties(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) GetProperty(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	result, err := h.svc.GetProperty(r.Context(), user, propertyID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListBookings(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListBookings(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}
