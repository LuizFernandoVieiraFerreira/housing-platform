package properties

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	cfg  *config.Config
	auth *auth.AuthorizationService
	repo *Repository
}

func NewService(cfg *config.Config, authSvc *auth.AuthorizationService, repo *Repository) *Service {
	return &Service{cfg: cfg, auth: authSvc, repo: repo}
}

func (s *Service) Search(ctx context.Context, query PropertySearchQuery) (PropertySearchResult, error) {
	s.validateSearchQuery(query)

	limit := query.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	criteria := toSearchCriteria(query)

	var rows []SearchPropertyRow
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		rows, err = s.repo.Search(ctx, tx, criteria, limit, offset)
		return err
	})
	if err != nil {
		return PropertySearchResult{}, err
	}

	totalCount := 0
	if len(rows) > 0 {
		totalCount = rows[0].TotalCount
	}

	items := make([]SearchPropertyCard, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapSearchPropertyCard(s.cfg, row))
	}

	return PropertySearchResult{Items: items, TotalCount: totalCount}, nil
}

func (s *Service) GetPublishedProperty(ctx context.Context, propertyID string) (PropertyDetail, error) {
	id, err := shared.ParseUUID(propertyID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid property ID"))
	}

	var detail PropertyDetail
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		property, err := s.repo.GetPublishedProperty(ctx, tx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				panic(apierrors.NotFound("Property not found"))
			}
			return err
		}
		if property.MonthlyPriceMin == nil {
			panic(apierrors.NotFound("Property not found"))
		}

		coords, err := s.repo.GetPublishedCoordinates(ctx, tx, id)
		if err != nil {
			return err
		}
		amenities, err := s.repo.GetPropertyAmenities(ctx, tx, id)
		if err != nil {
			return err
		}
		images, err := s.repo.GetPropertyImages(ctx, tx, id)
		if err != nil {
			return err
		}
		rooms, err := s.repo.GetPropertyRooms(ctx, tx, id)
		if err != nil {
			return err
		}
		hostName, err := s.repo.GetHostDisplayName(ctx, tx, property.HostID)
		if err != nil {
			return err
		}

		var lat, lng *float64
		if coords != nil {
			lat = &coords.Latitude
			lng = &coords.Longitude
		}

		detail = mapPropertyDetail(s.cfg, *property, hostName, lat, lng, images, rooms, amenities)
		return nil
	})
	if err != nil {
		return PropertyDetail{}, err
	}
	return detail, nil
}

func (s *Service) CreateProperty(ctx context.Context, user *auth.User, req HostPropertyRequest) (CreatedID, error) {
	hostID := s.requireHostID(ctx, user)
	slug := createPropertySlug(req.Title)
	fields := requestToPropertyFields(req)

	var createdID CreatedID
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		hostUUID, err := shared.ParseUUID(hostID)
		if err != nil {
			return err
		}

		id, err := s.repo.CreateProperty(ctx, tx, hostUUID, slug, fields)
		if err != nil {
			return err
		}

		if req.Latitude != nil && req.Longitude != nil {
			ok, err := s.repo.SetLocation(ctx, tx, id, *req.Latitude, *req.Longitude)
			if err != nil {
				return err
			}
			if !ok {
				panic(apierrors.BadRequest("Property location cannot be updated"))
			}
		}

		amenityIDs := parseAmenityIDs(req.AmenityIDs)
		if err := s.repo.SyncAmenities(ctx, tx, id, amenityIDs); err != nil {
			return err
		}

		createdID = CreatedID{ID: shared.UUIDToString(id)}
		return nil
	})
	return createdID, err
}

func (s *Service) UpdateProperty(ctx context.Context, user *auth.User, propertyID string, req HostPropertyRequest) (HostPropertyDetail, error) {
	id := mustParsePropertyID(propertyID)
	s.requireMutableProperty(ctx, user, id)

	fields := requestToPropertyFields(req)

	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		if err := s.repo.UpdateProperty(ctx, tx, id, fields); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				panic(apierrors.NotFound("Property not found"))
			}
			return err
		}

		if req.Latitude != nil && req.Longitude != nil {
			ok, err := s.repo.SetLocation(ctx, tx, id, *req.Latitude, *req.Longitude)
			if err != nil {
				return err
			}
			if !ok {
				panic(apierrors.BadRequest("Property location cannot be updated"))
			}
		}

		amenityIDs := parseAmenityIDs(req.AmenityIDs)
		return s.repo.SyncAmenities(ctx, tx, id, amenityIDs)
	})
	if err != nil {
		return HostPropertyDetail{}, err
	}

	return s.loadHostPropertyDetail(ctx, id)
}

func (s *Service) SetLocation(ctx context.Context, user *auth.User, propertyID string, req SetPropertyLocationRequest) error {
	id := mustParsePropertyID(propertyID)
	s.requireMutableProperty(ctx, user, id)

	return shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		ok, err := s.repo.SetLocation(ctx, tx, id, req.Latitude, req.Longitude)
		if err != nil {
			return err
		}
		if !ok {
			panic(apierrors.BadRequest("Property location cannot be updated"))
		}
		return nil
	})
}

func (s *Service) SubmitForReview(ctx context.Context, user *auth.User, propertyID string) (PropertyStatusChange, error) {
	id := mustParsePropertyID(propertyID)
	if err := s.auth.RequireHostOfProperty(ctx, user, propertyID); err != nil {
		panic(err)
	}

	var result PropertyStatusChange
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		property, err := s.repo.GetHostProperty(ctx, tx, id)
		if err != nil {
			return err
		}
		if property == nil {
			panic(apierrors.NotFound("Property not found"))
		}
		if property.Status != "draft" {
			panic(apierrors.BadRequest("Property must be in draft status to submit for review"))
		}

		count, err := s.repo.CountAvailableRooms(ctx, tx, id)
		if err != nil {
			return err
		}
		if count == 0 {
			panic(apierrors.BadRequest("Add at least one available room before submitting"))
		}

		hasLoc, err := s.repo.HasLocation(ctx, tx, id)
		if err != nil {
			return err
		}
		if !hasLoc {
			panic(apierrors.BadRequest("Geocode the property address before submitting"))
		}

		status, err := s.repo.SubmitForReview(ctx, tx, id)
		if err != nil {
			return err
		}
		if status == "" {
			panic(apierrors.BadRequest("Property must be in draft status to submit for review"))
		}

		result = PropertyStatusChange{ID: propertyID, Status: status}
		return nil
	})
	return result, err
}

func (s *Service) CreateRoom(ctx context.Context, user *auth.User, propertyID string, req CreateRoomRequest) (HostRoom, error) {
	id := mustParsePropertyID(propertyID)
	s.requireMutableProperty(ctx, user, id)

	var room HostRoom
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		created, err := s.repo.CreateRoom(ctx, tx, id, req)
		if err != nil {
			return err
		}
		room = mapHostRoom(*created)
		return nil
	})
	return room, err
}

func (s *Service) DeleteRoom(ctx context.Context, user *auth.User, roomID string) error {
	id, err := shared.ParseUUID(roomID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid room ID"))
	}

	return shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		propertyID, err := s.repo.FindRoomPropertyID(ctx, tx, id)
		if err != nil {
			return err
		}
		if !propertyID.Valid {
			panic(apierrors.NotFound("Room not found"))
		}

		propIDStr := shared.UUIDToString(propertyID)
		isAdmin, err := s.auth.IsAdmin(ctx, user.ID)
		if err != nil {
			return err
		}
		if !isAdmin {
			isHost, err := s.auth.IsHostOfProperty(ctx, user.ID, propIDStr)
			if err != nil {
				return err
			}
			if !isHost {
				panic(apierrors.Forbidden("Only the host of this property can perform this action"))
			}
		}

		deleted, err := s.repo.DeleteRoom(ctx, tx, id)
		if err != nil {
			return err
		}
		if !deleted {
			panic(apierrors.NotFound("Room not found"))
		}
		return nil
	})
}

func (s *Service) ListAmenities(ctx context.Context) ([]Amenity, error) {
	rows, err := s.repo.ListAmenities(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]Amenity, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapAmenity(row))
	}
	return out, nil
}

func (s *Service) loadHostPropertyDetail(ctx context.Context, propertyID pgtype.UUID) (HostPropertyDetail, error) {
	var detail HostPropertyDetail
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		property, err := s.repo.GetHostProperty(ctx, tx, propertyID)
		if err != nil {
			return err
		}
		if property == nil {
			panic(apierrors.NotFound("Property not found"))
		}

		coords, err := s.repo.GetCoordinates(ctx, tx, propertyID)
		if err != nil {
			return err
		}
		amenityIDs, err := s.repo.GetPropertyAmenityIDs(ctx, tx, propertyID)
		if err != nil {
			return err
		}
		rooms, err := s.repo.GetPropertyRooms(ctx, tx, propertyID)
		if err != nil {
			return err
		}

		var lat, lng *float64
		if coords != nil {
			lat = &coords.Latitude
			lng = &coords.Longitude
		}

		detail = MapHostPropertyDetail(*property, rooms, amenityIDs, lat, lng)
		return nil
	})
	return detail, err
}

func (s *Service) requireHostID(ctx context.Context, user *auth.User) string {
	hostID, err := s.auth.GetHostIDForProfile(ctx, user.ID)
	if err != nil {
		panic(apierrors.InternalError("Failed to resolve host profile"))
	}
	if hostID == "" {
		panic(apierrors.Forbidden("Host profile is required before creating listings"))
	}
	return hostID
}

func (s *Service) requireMutableProperty(ctx context.Context, user *auth.User, propertyID pgtype.UUID) {
	propIDStr := shared.UUIDToString(propertyID)

	var property *db.Property
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		property, err = s.repo.GetHostProperty(ctx, tx, propertyID)
		return err
	})
	if err != nil {
		panic(apierrors.InternalError("Failed to load property"))
	}
	if property == nil {
		panic(apierrors.NotFound("Property not found"))
	}

	isAdmin, err := s.auth.IsAdmin(ctx, user.ID)
	if err != nil {
		panic(apierrors.InternalError("Failed to check admin status"))
	}
	if isAdmin {
		return
	}

	isHost, err := s.auth.IsHostOfProperty(ctx, user.ID, propIDStr)
	if err != nil {
		panic(apierrors.InternalError("Failed to check host ownership"))
	}
	if !isHost {
		panic(apierrors.Forbidden("Only the host of this property can perform this action"))
	}

	if property.Status != "draft" && property.Status != "pending_review" {
		panic(apierrors.BadRequest("Property can only be updated while draft or pending review"))
	}
}

func (s *Service) validateSearchQuery(query PropertySearchQuery) {
	if query.PriceMin != nil && query.PriceMax != nil && *query.PriceMax < *query.PriceMin {
		panic(apierrors.BadRequest("priceMax must be greater than or equal to priceMin"))
	}
	if query.CheckIn != nil && query.CheckOut != nil && *query.CheckOut <= *query.CheckIn {
		panic(apierrors.BadRequest("checkOut must be after checkIn"))
	}
}

func mustParsePropertyID(propertyID string) pgtype.UUID {
	id, err := shared.ParseUUID(propertyID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid property ID"))
	}
	return id
}

func parseAmenityIDs(raw []string) []pgtype.UUID {
	if len(raw) == 0 {
		return nil
	}
	out := make([]pgtype.UUID, 0, len(raw))
	for _, value := range raw {
		id, err := shared.ParseUUID(value)
		if err != nil {
			panic(apierrors.BadRequest("Invalid amenity ID"))
		}
		out = append(out, id)
	}
	return out
}
