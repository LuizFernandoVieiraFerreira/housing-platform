package properties

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/housing-platform/backend-go/internal/deps"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Handler struct {
	svc *Service
}

func NewHandler(d *deps.Deps) *Handler {
	return &Handler{
		svc: NewService(d.Config, d.Auth.Authorization, NewRepository(d.Pool)),
	}
}

func Routes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()

	r.Get("/", h.Search)
	r.Get("/{propertyID}", h.GetProperty)

	r.Group(func(r chi.Router) {
		r.Use(d.Auth.Required())
		r.Post("/", h.CreateProperty)
		r.Patch("/{propertyID}", h.UpdateProperty)
		r.Post("/{propertyID}/submit-review", h.SubmitForReview)
		r.Post("/{propertyID}/location", h.SetLocation)
		r.Post("/{propertyID}/rooms", h.CreateRoom)
	})

	return r
}

func AmenitiesRoutes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()
	r.Get("/", h.ListAmenities)
	return r
}

func RoomRoutes(d *deps.Deps) chi.Router {
	h := NewHandler(d)
	r := chi.NewRouter()
	r.Use(d.Auth.Required())
	r.Delete("/{roomID}", h.DeleteRoom)
	return r
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query := parseSearchQuery(r)
	result, err := h.svc.Search(r.Context(), query)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) GetProperty(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "propertyID")
	result, err := h.svc.GetPublishedProperty(r.Context(), propertyID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	var req HostPropertyRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.CreateProperty(r.Context(), user, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) UpdateProperty(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	var req HostPropertyRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.UpdateProperty(r.Context(), user, propertyID, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) SubmitForReview(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	result, err := h.svc.SubmitForReview(r.Context(), user, propertyID)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) SetLocation(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	var req SetPropertyLocationRequest
	shared.DecodeJSON(r, &req)
	if err := h.svc.SetLocation(r.Context(), user, propertyID, req); err != nil {
		panic(err)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	propertyID := chi.URLParam(r, "propertyID")
	var req CreateRoomRequest
	shared.DecodeJSON(r, &req)
	result, err := h.svc.CreateRoom(r.Context(), user, propertyID, req)
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	user := auth.RequireUser(r.Context())
	roomID := chi.URLParam(r, "roomID")
	if err := h.svc.DeleteRoom(r.Context(), user, roomID); err != nil {
		panic(err)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListAmenities(w http.ResponseWriter, r *http.Request) {
	result, err := h.svc.ListAmenities(r.Context())
	if err != nil {
		panic(err)
	}
	shared.WriteJSON(w, http.StatusOK, result)
}

func parseSearchQuery(r *http.Request) PropertySearchQuery {
	q := r.URL.Query()
	first := func(key string) *string {
		v := strings.TrimSpace(q.Get(key))
		if v == "" {
			return nil
		}
		return &v
	}
	intPtr := func(key string) *int {
		v := strings.TrimSpace(q.Get(key))
		if v == "" {
			return nil
		}
		n, err := strconv.Atoi(v)
		if err != nil {
			return nil
		}
		return &n
	}
	floatPtr := func(key string) *float64 {
		v := strings.TrimSpace(q.Get(key))
		if v == "" {
			return nil
		}
		n, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return nil
		}
		return &n
	}
	list := func(key string) []string {
		raw := q[key]
		if len(raw) == 0 {
			return nil
		}
		var out []string
		for _, item := range raw {
			for _, part := range strings.Split(item, ",") {
				part = strings.TrimSpace(part)
				if part != "" {
					out = append(out, part)
				}
			}
		}
		return out
	}

	sort := q.Get("sort")
	if sort == "" {
		sort = "recommended"
	}

	limit := 20
	if v := intPtr("limit"); v != nil {
		limit = *v
	}
	offset := 0
	if v := intPtr("offset"); v != nil {
		offset = *v
	}

	return PropertySearchQuery{
		Query:              first("query"),
		PropertyType:       first("propertyType"),
		CheckIn:            first("checkIn"),
		CheckOut:           first("checkOut"),
		Guests:             intPtr("guests"),
		PriceMin:           intPtr("priceMin"),
		PriceMax:           intPtr("priceMax"),
		Sort:               sort,
		CenterLat:          floatPtr("centerLat"),
		CenterLng:          floatPtr("centerLng"),
		North:              floatPtr("north"),
		South:              floatPtr("south"),
		East:               floatPtr("east"),
		West:               floatPtr("west"),
		AmenitySlugs:       list("amenitySlugs"),
		MaxStationWalkMin:  intPtr("maxStationWalkMin"),
		ExcludePropertyIDs: list("excludePropertyIds"),
		Limit:              limit,
		Offset:             offset,
	}
}
