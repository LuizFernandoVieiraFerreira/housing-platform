package notifications

import (
	"context"

	"github.com/jackc/pgx/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListNotifications(ctx context.Context, user *auth.User) ([]Notification, error) {
	userID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return nil, err
	}

	var items []Notification
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		rows, err := s.repo.ListForUser(ctx, tx, userID)
		if err != nil {
			return err
		}
		items = make([]Notification, 0, len(rows))
		for _, row := range rows {
			items = append(items, mapNotification(row))
		}
		return nil
	})
	return items, err
}

func (s *Service) GetUnreadCount(ctx context.Context, user *auth.User) (UnreadNotificationCount, error) {
	userID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return UnreadNotificationCount{}, err
	}

	var count int
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		count, err = s.repo.CountUnread(ctx, tx, userID)
		return err
	})
	return UnreadNotificationCount{Count: count}, err
}

func (s *Service) MarkRead(ctx context.Context, user *auth.User, notificationID string) (Notification, error) {
	userID, err := shared.ParseUUID(user.ID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid user ID"))
	}
	notifUUID, err := shared.ParseUUID(notificationID)
	if err != nil {
		panic(apierrors.BadRequest("Invalid notification ID"))
	}

	var result Notification
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		row, err := s.repo.MarkRead(ctx, tx, userID, notifUUID)
		if err != nil {
			return err
		}
		if row == nil {
			panic(apierrors.NotFound("Notification not found"))
		}
		result = mapNotification(*row)
		return nil
	})
	return result, err
}

func (s *Service) MarkAllRead(ctx context.Context, user *auth.User) (MarkAllNotificationsReadResult, error) {
	userID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return MarkAllNotificationsReadResult{}, err
	}

	var updated int
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		var err error
		updated, err = s.repo.MarkAllRead(ctx, tx, userID)
		return err
	})
	return MarkAllNotificationsReadResult{UpdatedCount: updated}, err
}
