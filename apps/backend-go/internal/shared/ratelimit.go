package shared

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
)

type RateLimitService struct {
	pool *pgxpool.Pool
}

func NewRateLimitService(pool *pgxpool.Pool) *RateLimitService {
	return &RateLimitService{pool: pool}
}

func (s *RateLimitService) AssertRateLimit(ctx context.Context, tx pgx.Tx, bucket string, maxRequests int, windowSeconds int) error {
	trimmed := strings.TrimSpace(bucket)
	if trimmed == "" || maxRequests <= 0 || windowSeconds <= 0 {
		panic(apierrors.RateLimited("Rate limit exceeded"))
	}

	now := time.Now().UTC()
	windowStartEpoch := (now.Unix() / int64(windowSeconds)) * int64(windowSeconds)
	windowStart := time.Unix(windowStartEpoch, 0).UTC()

	var count int32
	err := tx.QueryRow(ctx, `
		INSERT INTO api_rate_limits (bucket, window_start, request_count)
		VALUES ($1, $2, 1)
		ON CONFLICT (bucket, window_start)
		DO UPDATE SET request_count = api_rate_limits.request_count + 1
		RETURNING request_count
	`, trimmed, windowStart).Scan(&count)
	if err != nil {
		return err
	}

	if count > int32(maxRequests) {
		panic(apierrors.RateLimited("Rate limit exceeded"))
	}

	return nil
}
