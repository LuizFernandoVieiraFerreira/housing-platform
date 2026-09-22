package admin

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
	return &Handler{svc: NewService(d.Auth.Authorization, NewRepository(d.Pool))}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()
	r.Use(d.Auth.RequireAdmin())

	r.Get("/stats", h.GetStats)
	r.Get("/properties", h.ListProperties)
	r.Post("/properties/{propertyID}/publish", h.PublishProperty)
	r.Post("/properties/{propertyID}/reject", h.RejectPropertyReview)
	r.Get("/hosts", h.ListHosts)
	r.Post("/hosts/{hostID}/approve", h.ApproveHost)
	r.Get("/bookings", h.ListBookings)
	r.Get("/payments", h.ListPayments)
	r.Get("/housing-requests", h.ListHousingRequests)
	r.Patch("/housing-requests/{requestID}", h.UpdateHousingRequestStatus)
	r.Get("/audit-logs", h.ListAuditLogs)

	return r
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.GetDashboardStats(r.Context(), user)
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

func (h *Handler) PublishProperty(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	result, err := h.svc.PublishProperty(r.Context(), user, propertyID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) RejectPropertyReview(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	result, err := h.svc.RejectPropertyReview(r.Context(), user, propertyID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListHosts(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListHosts(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ApproveHost(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	hostID := chi.URLParam(r, "hostID")
	result, err := h.svc.ApproveHost(r.Context(), user, hostID)
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

func (h *Handler) ListPayments(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListPayments(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListHousingRequests(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListHousingRequests(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) UpdateHousingRequestStatus(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	requestID := chi.URLParam(r, "requestID")
	var req UpdateHousingRequestStatusRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.UpdateHousingRequestStatus(r.Context(), user, requestID, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListAuditLogs(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}
