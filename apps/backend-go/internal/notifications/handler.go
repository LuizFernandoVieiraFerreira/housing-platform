package notifications

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

	r.Get("/", h.ListNotifications)
	r.Get("/unread-count", h.GetUnreadCount)
	r.Post("/read-all", h.MarkAllRead)
	r.Post("/{notificationID}/read", h.MarkRead)

	return r
}

func (h *Handler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListNotifications(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.GetUnreadCount(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) MarkRead(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	notificationID := chi.URLParam(r, "notificationID")
	result, err := h.svc.MarkRead(r.Context(), user, notificationID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.MarkAllRead(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}
