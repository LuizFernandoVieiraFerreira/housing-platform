package bookings

import (
	"net/http"
	"strconv"

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
		svc: NewService(
			d.Auth.Authorization,
			repo,
			shared.NewPricingService(d.Pool),
			shared.NewRateLimitService(d.Pool),
		),
	}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()

	r.With(d.Auth.Optional()).Get("/quote", h.Quote)

	r.Group(func(r chi.Router) {
		r.Use(d.Auth.Required())
		r.Get("/", h.ListBookings)
		r.Post("/", h.CreateBooking)
		r.Get("/{bookingID}", h.GetBooking)
		r.Post("/{bookingID}/cancel", h.CancelBooking)
		r.Post("/{bookingID}/approve", h.ApproveBooking)
		r.Post("/{bookingID}/reject", h.RejectBooking)
	})

	return r
}

func (h *Handler) Quote(w http.ResponseWriter, r *http.Request) {
	query := BookingQuoteQuery{
		RoomID:     r.URL.Query().Get("roomId"),
		CheckIn:    r.URL.Query().Get("checkIn"),
		CheckOut:   r.URL.Query().Get("checkOut"),
		GuestCount: parseIntDefault(r.URL.Query().Get("guestCount"), 0),
	}

	actor := "anon"
	if user := auth.GetUser(r.Context()); user != nil {
		actor = user.ID
	}

	result, err := h.svc.Quote(r.Context(), query, actor)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ListBookings(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	result, err := h.svc.ListMyBookings(r.Context(), user)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req CreateBookingRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.CreateBookingHold(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	bookingID := chi.URLParam(r, "bookingID")
	result, err := h.svc.GetBookingDetail(r.Context(), user, bookingID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	bookingID := chi.URLParam(r, "bookingID")
	result, err := h.svc.CancelBooking(r.Context(), user, bookingID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) ApproveBooking(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	bookingID := chi.URLParam(r, "bookingID")
	result, err := h.svc.ApproveBooking(r.Context(), user, bookingID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) RejectBooking(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	bookingID := chi.URLParam(r, "bookingID")
	result, err := h.svc.RejectBooking(r.Context(), user, bookingID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func parseIntDefault(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	n, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return n
}
