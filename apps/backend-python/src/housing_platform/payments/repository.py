import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from housing_platform.auth.errors import (
    BadRequestError,
    BookingExpiredError,
    ForbiddenError,
)
from housing_platform.db.models import (
    BookingPriceSnapshots,
    Bookings,
    Payments,
    PlatformSettings,
    Properties,
)


@dataclass(frozen=True)
class PaymentOrderRow:
    payment_id: uuid.UUID
    order_id: uuid.UUID
    booking_id: uuid.UUID
    amount_krw: int
    order_name: str


@dataclass(frozen=True)
class PaymentLookupRow:
    id: uuid.UUID
    order_id: uuid.UUID
    booking_id: uuid.UUID
    customer_id: uuid.UUID
    amount_krw: int
    status: str


class PaymentRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_payment_by_order_id(self, order_id: uuid.UUID) -> PaymentLookupRow | None:
        payment = self._db.scalar(select(Payments).where(Payments.order_id == order_id))
        if payment is None:
            return None
        return PaymentLookupRow(
            id=payment.id,
            order_id=payment.order_id,
            booking_id=payment.booking_id,
            customer_id=payment.customer_id,
            amount_krw=payment.amount_krw,
            status=payment.status,
        )

    def create_payment_order(
        self,
        booking_id: uuid.UUID,
        customer_id: uuid.UUID,
    ) -> PaymentOrderRow:
        booking = self._db.scalar(
            select(Bookings).where(Bookings.id == booking_id).with_for_update()
        )
        if booking is None or booking.customer_id != customer_id:
            raise ForbiddenError("Booking not found")

        if booking.status == "payment_failed":
            if booking.payment_retry_count >= 1:
                raise BadRequestError("Payment retry limit reached")

            settings = self._get_platform_settings()
            booking.status = "pending_payment"
            booking.payment_retry_count = booking.payment_retry_count + 1
            booking.hold_expires_at = datetime.now(UTC) + timedelta(
                minutes=settings.hold_ttl_minutes
            )
            self._db.flush()
        elif booking.status != "pending_payment":
            raise ForbiddenError("Booking is not awaiting payment")

        if booking.hold_expires_at is not None and booking.hold_expires_at <= datetime.now(UTC):
            booking.status = "expired"
            self._db.flush()
            raise BookingExpiredError("Booking hold has expired")

        snapshot = self._db.scalar(
            select(BookingPriceSnapshots).where(BookingPriceSnapshots.booking_id == booking_id)
        )
        if snapshot is None:
            raise BadRequestError("Booking price snapshot missing")

        property_title = self._db.scalar(
            select(Properties.title).where(Properties.id == booking.property_id)
        )

        order_id = uuid.uuid4()
        payment = Payments(
            order_id=order_id,
            booking_id=booking_id,
            customer_id=customer_id,
            amount_krw=snapshot.total_krw,
            status="pending",
        )
        self._db.add(payment)
        self._db.flush()

        return PaymentOrderRow(
            payment_id=payment.id,
            order_id=payment.order_id,
            booking_id=payment.booking_id,
            amount_krw=payment.amount_krw,
            order_name=property_title or "Housing Platform stay",
        )

    def _get_platform_settings(self) -> PlatformSettings:
        settings = self._db.scalar(select(PlatformSettings).where(PlatformSettings.id == 1))
        if settings is None:
            raise BadRequestError("Platform settings are not configured")
        return settings
