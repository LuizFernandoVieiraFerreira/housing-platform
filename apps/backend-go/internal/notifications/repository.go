package notifications

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/db"
)

const listLimit = 50

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListForUser(ctx context.Context, q pgx.Tx, userID pgtype.UUID) ([]db.Notification, error) {
	rows, err := q.Query(ctx, `
		SELECT id, user_id, type, title, body, metadata, read_at, created_at
		FROM public.notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, listLimit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []db.Notification
	for rows.Next() {
		var n db.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Metadata, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, rows.Err()
}

func (r *Repository) CountUnread(ctx context.Context, q pgx.Tx, userID pgtype.UUID) (int, error) {
	var count int
	err := q.QueryRow(ctx, `
		SELECT count(*)::integer FROM public.notifications
		WHERE user_id = $1 AND read_at IS NULL
	`, userID).Scan(&count)
	return count, err
}

func (r *Repository) MarkRead(ctx context.Context, q pgx.Tx, userID, notificationID pgtype.UUID) (*db.Notification, error) {
	now := time.Now().UTC()
	var n db.Notification
	err := q.QueryRow(ctx, `
		UPDATE public.notifications SET read_at = $3
		WHERE id = $1 AND user_id = $2 AND read_at IS NULL
		RETURNING id, user_id, type, title, body, metadata, read_at, created_at
	`, notificationID, userID, now).Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Metadata, &n.ReadAt, &n.CreatedAt)
	if err == nil {
		return &n, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	err = q.QueryRow(ctx, `
		SELECT id, user_id, type, title, body, metadata, read_at, created_at
		FROM public.notifications WHERE id = $1 AND user_id = $2
	`, notificationID, userID).Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Metadata, &n.ReadAt, &n.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &n, nil
}

func (r *Repository) MarkAllRead(ctx context.Context, q pgx.Tx, userID pgtype.UUID) (int, error) {
	now := time.Now().UTC()
	tag, err := q.Exec(ctx, `
		UPDATE public.notifications SET read_at = $2
		WHERE user_id = $1 AND read_at IS NULL
	`, userID, now)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}
