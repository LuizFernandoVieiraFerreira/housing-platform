package hosts

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/properties"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	auth       *auth.AuthorizationService
	repo       *Repository
	properties *properties.Repository
}

func NewService(authSvc *auth.AuthorizationService, repo *Repository, propRepo *properties.Repository) *Service {
	return &Service{auth: authSvc, repo: repo, properties: propRepo}
}

func (s *Service) Register(ctx context.Context, user *auth.User, req RegisterHostRequest) (Host, error) {
	displayName := strings.TrimSpace(req.DisplayName)
	if displayName == "" {
		panic(apierrors.BadRequest("Display name is required"))
	}

	var host Host
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		profileID, err := shared.ParseUUID(user.ID)
		if err != nil {
			return err
		}
		row, err := s.repo.Register(ctx, tx, profileID, displayName)
		if err != nil {
			return err
		}
		host = mapHost(*row)
		return nil
	})
	return host, err
}

func (s *Service) GetCurrentHost(ctx context.Context, user *auth.User) (*Host, error) {
	profileID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return nil, err
	}

	var result *Host
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		row, err := s.repo.GetByProfileID(ctx, tx, profileID)
		if err != nil {
			return err
		}
		if row == nil {
			return nil
		}
		mapped := mapHost(*row)
		result = &mapped
		return nil
	})
	return result, err
}

func (s *Service) ListProperties(ctx context.Context, user *auth.User) ([]HostPropertyListItem, error) {
	hostID := s.requireHostID(ctx, user)
	var items []HostPropertyListItem
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		hostUUID, err := shared.ParseUUID(hostID)
		if err != nil {
			return err
		}
		rows, err := s.repo.ListProperties(ctx, tx, hostUUID)
		if err != nil {
			return err
		}
		items = make([]HostPropertyListItem, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapHostPropertyListItem(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) GetProperty(ctx context.Context, user *auth.User, propertyID string) (properties.HostPropertyDetail, error) {
	hostID := s.requireHostID(ctx, user)
	propID, err := shared.ParseUUID(propertyID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid property ID"))
	}

	var detail properties.HostPropertyDetail
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		hostUUID, err := shared.ParseUUID(hostID)
		if err != nil {
			return err
		}
		belongs, err := s.repo.PropertyBelongsToHost(ctx, tx, hostUUID, propID)
		if err != nil {
			return err
		}
		if !belongs {
			panic(apierrors.NotFound("Property not found"))
		}

		property, err := s.properties.GetHostProperty(ctx, tx, propID)
		if err != nil {
			return err
		}
		if property == nil {
			panic(apierrors.NotFound("Property not found"))
		}

		coords, err := s.properties.GetCoordinates(ctx, tx, propID)
		if err != nil {
			return err
		}
		amenityIDs, err := s.properties.GetPropertyAmenityIDs(ctx, tx, propID)
		if err != nil {
			return err
		}
		rooms, err := s.properties.GetPropertyRooms(ctx, tx, propID)
		if err != nil {
			return err
		}

		var lat, lng *float64
		if coords != nil {
			lat = &coords.Latitude
			lng = &coords.Longitude
		}

		detail = properties.MapHostPropertyDetail(*property, rooms, amenityIDs, lat, lng)
		return nil
	})
	return detail, err
}

func (s *Service) ListBookings(ctx context.Context, user *auth.User) ([]HostBooking, error) {
	hostID := s.requireHostID(ctx, user)
	var items []HostBooking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		hostUUID, err := shared.ParseUUID(hostID)
		if err != nil {
			return err
		}
		rows, err := s.repo.ListBookings(ctx, tx, hostUUID)
		if err != nil {
			return err
		}
		items = make([]HostBooking, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapHostBooking(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) requireHostID(ctx context.Context, user *auth.User) string {
	hostID, err := s.auth.GetHostIDForProfile(ctx, user.ID)
	if err != nil {
		panic(apierrors.InternalError("Failed to resolve host profile"))
	}
	if hostID == "" {
		panic(apierrors.Forbidden("Host profile is required"))
	}
	return hostID
}
