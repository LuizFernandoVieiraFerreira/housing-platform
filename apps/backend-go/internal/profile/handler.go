package profile

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Handler struct {
	svc *Service
}

func NewHandler(d *deps.Deps) *Handler {
	return &Handler{svc: NewService(NewRepository(d.Pool))}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()
	r.Use(d.Auth.Required())

	r.Get("/", h.GetProfile)
	r.Patch("/", h.UpdateProfile)

	return r
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.GetProfile(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req UpdateProfileRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.UpdateProfile(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}
