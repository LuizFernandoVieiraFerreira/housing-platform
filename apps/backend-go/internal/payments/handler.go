package payments

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
	repo := NewRepository(d.Pool)
	return &Handler{
		svc: NewService(d.Config, repo, shared.NewRateLimitService(d.Pool)),
	}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()

	r.Post("/webhook", h.ReceiveWebhook)

	r.Group(func(r chi.Router) {
		r.Use(d.Auth.Required())
		r.Post("/orders", h.CreatePaymentOrder)
		r.Post("/confirm", h.ConfirmPayment)
	})

	return r
}

func (h *Handler) CreatePaymentOrder(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req CreatePaymentOrderRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.CreatePaymentOrder(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) ConfirmPayment(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req ConfirmPaymentRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.ConfirmPayment(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ReceiveWebhook(w http.ResponseWriter, r *http.Request) {
	var payload TossWebhookPayload
	shared.DecodeJSON(r, &payload)
	result, err := h.svc.ReceiveWebhook(r.Context(), payload)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}
