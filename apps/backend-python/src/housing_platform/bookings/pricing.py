from dataclasses import dataclass
from math import floor

from sqlalchemy import select
from sqlalchemy.orm import Session

from housing_platform.auth.errors import BadRequestError
from housing_platform.db.models import PlatformSettings

PLATFORM_SETTINGS_ID = 1


@dataclass(frozen=True)
class BookingPrice:
    rent_krw: int
    service_fee_krw: int
    total_krw: int
    pricing_version: str


class BookingPricingService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def calculate_price(self, monthly_price_krw: int, nights: int) -> BookingPrice:
        if monthly_price_krw <= 0:
            raise BadRequestError("Monthly price must be positive")
        if nights <= 0:
            raise BadRequestError("Stay length must be positive")

        settings = self._get_platform_settings()
        rent_krw = _round_down_to_thousands((monthly_price_krw / 30) * nights)
        service_fee_krw = _round_down_to_thousands(rent_krw * settings.service_fee_bps / 10_000)
        total_krw = rent_krw + service_fee_krw

        return BookingPrice(
            rent_krw=rent_krw,
            service_fee_krw=service_fee_krw,
            total_krw=total_krw,
            pricing_version=settings.pricing_version,
        )

    def get_hold_ttl_minutes(self) -> int:
        return self._get_platform_settings().hold_ttl_minutes

    def _get_platform_settings(self) -> PlatformSettings:
        settings = self._db.scalar(
            select(PlatformSettings).where(PlatformSettings.id == PLATFORM_SETTINGS_ID)
        )
        if settings is None:
            raise BadRequestError("Platform settings are not configured")
        return settings


def _round_down_to_thousands(value: float) -> int:
    return int(floor(value / 1000) * 1000)
