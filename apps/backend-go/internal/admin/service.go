package admin

import (
	"context"

	"github.com/jackc/pgx/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/hosts"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	auth *auth.AuthorizationService
	repo *Repository
}

func NewService(authSvc *auth.AuthorizationService, repo *Repository) *Service {
	return &Service{auth: authSvc, repo: repo}
}

func (s *Service) requireAdmin(ctx context.Context, user *auth.User) {
	if err := s.auth.RequireAdmin(ctx, user); err != nil {
		panic(err)
	}
}

func (s *Service) GetDashboardStats(ctx context.Context, user *auth.User) (AdminDashboardStats, error) {
	s.requireAdmin(ctx, user)
	var stats AdminDashboardStats
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		stats, err = s.repo.GetDashboardStats(ctx, tx)
		return err
	})
	return stats, err
}

func (s *Service) ListProperties(ctx context.Context, user *auth.User) ([]AdminProperty, error) {
	s.requireAdmin(ctx, user)
	var items []AdminProperty
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListProperties(ctx, tx)
		if err != nil {
			return err
		}
		items = make([]AdminProperty, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapAdminProperty(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) PublishProperty(ctx context.Context, user *auth.User, propertyID string) (PropertyStatusChange, error) {
	s.requireAdmin(ctx, user)
	propUUID, err := shared.ParseUUID(propertyID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid property ID"))
	}

	var result PropertyStatusChange
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		property, err := s.repo.PublishProperty(ctx, tx, propUUID)
		if err != nil {
			return err
		}
		if property == nil {
			panic(apierrors.BadRequest("Property must be pending review before it can be published"))
		}

		actorID, _ := shared.ParseUUID(user.ID)
		_ = s.repo.WriteAuditLog(ctx, tx, actorID, "property.published", "property", property.ID, map[string]any{
			"title": property.Title,
			"slug":  property.Slug,
		})

		result = PropertyStatusChange{ID: propertyID, Status: string(property.Status)}
		return nil
	})
	return result, err
}

func (s *Service) RejectPropertyReview(ctx context.Context, user *auth.User, propertyID string) (PropertyStatusChange, error) {
	s.requireAdmin(ctx, user)
	propUUID, err := shared.ParseUUID(propertyID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid property ID"))
	}

	var result PropertyStatusChange
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		property, err := s.repo.RejectPropertyReview(ctx, tx, propUUID)
		if err != nil {
			return err
		}
		if property == nil {
			panic(apierrors.BadRequest("Property must be pending review before it can be rejected"))
		}

		actorID, _ := shared.ParseUUID(user.ID)
		_ = s.repo.WriteAuditLog(ctx, tx, actorID, "property.review_rejected", "property", property.ID, map[string]any{
			"title": property.Title,
			"slug":  property.Slug,
		})

		result = PropertyStatusChange{ID: propertyID, Status: string(property.Status)}
		return nil
	})
	return result, err
}

func (s *Service) ListHosts(ctx context.Context, user *auth.User) ([]AdminHost, error) {
	s.requireAdmin(ctx, user)
	var items []AdminHost
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListHosts(ctx, tx)
		if err != nil {
			return err
		}
		items = make([]AdminHost, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapAdminHost(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) ApproveHost(ctx context.Context, user *auth.User, hostID string) (hosts.Host, error) {
	s.requireAdmin(ctx, user)
	hostUUID, err := shared.ParseUUID(hostID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid host ID"))
	}

	var result hosts.Host
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		host, err := s.repo.ApproveHost(ctx, tx, hostUUID)
		if err != nil {
			return err
		}
		if host == nil {
			panic(apierrors.BadRequest("Host must be pending before it can be approved"))
		}

		actorID, _ := shared.ParseUUID(user.ID)
		_ = s.repo.WriteAuditLog(ctx, tx, actorID, "host.approved", "host", host.ID, map[string]any{
			"displayName": host.DisplayName,
		})

		result = hosts.MapHost(*host)
		return nil
	})
	return result, err
}

func (s *Service) ListBookings(ctx context.Context, user *auth.User) ([]hosts.HostBooking, error) {
	s.requireAdmin(ctx, user)
	var items []hosts.HostBooking
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		items, err = s.repo.ListBookings(ctx, tx)
		return err
	})
	return items, err
}

func (s *Service) ListPayments(ctx context.Context, user *auth.User) ([]AdminPayment, error) {
	s.requireAdmin(ctx, user)
	var items []AdminPayment
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListPayments(ctx, tx)
		if err != nil {
			return err
		}
		items = make([]AdminPayment, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapAdminPayment(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) ListHousingRequests(ctx context.Context, user *auth.User) ([]HousingRequest, error) {
	s.requireAdmin(ctx, user)
	var items []HousingRequest
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListHousingRequests(ctx, tx)
		if err != nil {
			return err
		}
		items = make([]HousingRequest, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapHousingRequest(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) UpdateHousingRequestStatus(ctx context.Context, user *auth.User, requestID string, req UpdateHousingRequestStatusRequest) (HousingRequest, error) {
	s.requireAdmin(ctx, user)
	reqUUID, err := shared.ParseUUID(requestID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid request ID"))
	}

	var result HousingRequest
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		updated, err := s.repo.UpdateHousingRequestStatus(ctx, tx, reqUUID, req.Status)
		if err != nil {
			return err
		}
		if updated == nil {
			panic(apierrors.NotFound("Housing request not found"))
		}

		actorID, _ := shared.ParseUUID(user.ID)
		_ = s.repo.WriteAuditLog(ctx, tx, actorID, "housing_request.status_updated", "housing_request", updated.ID, map[string]any{
			"status": updated.Status,
		})

		result = mapHousingRequest(*updated)
		return nil
	})
	return result, err
}

func (s *Service) ListAuditLogs(ctx context.Context, user *auth.User) ([]AuditLog, error) {
	s.requireAdmin(ctx, user)
	var items []AuditLog
	err := shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListAuditLogs(ctx, tx, 100)
		if err != nil {
			return err
		}
		items = make([]AuditLog, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapAuditLog(row))
		}
		return nil
	})
	return items, err
}
