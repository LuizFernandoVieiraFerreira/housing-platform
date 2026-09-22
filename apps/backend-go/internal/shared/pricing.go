package shared

import (
	"context"
	"errors"
	"math"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
)

const platformSettingsID = 1

type BookingPrice struct {
	RentKrw         int
	ServiceFeeKrw   int
	TotalKrw        int
	PricingVersion  string
	HoldTTLMinutes  int
}

type rowQuerier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type PricingService struct {
	pool *pgxpool.Pool
}

func NewPricingService(pool *pgxpool.Pool) *PricingService {
	return &PricingService{pool: pool}
}

func (s *PricingService) CalculatePrice(ctx context.Context, monthlyPriceKrw int, nights int) (BookingPrice, error) {
	if monthlyPriceKrw <= 0 {
		return BookingPrice{}, apierrors.BadRequest("Monthly price must be positive")
	}
	if nights <= 0 {
		return BookingPrice{}, apierrors.BadRequest("Stay length must be positive")
	}

	settings, err := s.getPlatformSettings(ctx, s.pool)
	if err != nil {
		return BookingPrice{}, err
	}

	rentKrw := roundDownToThousands(float64(monthlyPriceKrw) / 30 * float64(nights))
	serviceFeeKrw := roundDownToThousands(float64(rentKrw) * float64(settings.ServiceFeeBps) / 10_000)

	return BookingPrice{
		RentKrw:        rentKrw,
		ServiceFeeKrw:  serviceFeeKrw,
		TotalKrw:       rentKrw + serviceFeeKrw,
		PricingVersion: settings.PricingVersion,
		HoldTTLMinutes: settings.HoldTTLMinutes,
	}, nil
}

func (s *PricingService) GetHoldTTLMinutes(ctx context.Context, q pgx.Tx) (int, error) {
	settings, err := s.getPlatformSettings(ctx, q)
	if err != nil {
		return 0, err
	}
	return settings.HoldTTLMinutes, nil
}

type platformSettings struct {
	ServiceFeeBps  int
	HoldTTLMinutes int
	PricingVersion string
}

func (s *PricingService) getPlatformSettings(ctx context.Context, q rowQuerier) (platformSettings, error) {
	var settings platformSettings
	err := q.QueryRow(ctx, `
		SELECT service_fee_bps, hold_ttl_minutes, pricing_version
		FROM platform_settings
		WHERE id = $1
	`, platformSettingsID).Scan(&settings.ServiceFeeBps, &settings.HoldTTLMinutes, &settings.PricingVersion)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return platformSettings{}, apierrors.BadRequest("Platform settings are not configured")
		}
		return platformSettings{}, err
	}
	return settings, nil
}

func roundDownToThousands(value float64) int {
	return int(math.Floor(value/1000) * 1000)
}

func CalculateServiceFeePercent(rentKrw int, serviceFeeKrw int) float64 {
	if rentKrw <= 0 {
		return 0
	}
	return math.Round((float64(serviceFeeKrw)/float64(rentKrw))*100*100) / 100
}
