import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from housing_platform.auth.errors import (
    BadRequestError,
    BookingExpiredError,
    ForbiddenError,
    NotFoundError,
    PaymentAmountMismatchError,
    RateLimitedError,
)
from housing_platform.db.models import (
    BookingPriceSnapshots,
    Bookings,
    PaymentEvents,
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

    def assert_rate_limit(self, bucket: str, max_requests: int, window_seconds: int) -> None:
        try:
            self._db.execute(
                text(
                    """
                    select public.assert_rate_limit(:bucket, :max_requests, :window_seconds)
                    """
                ),
                {
                    "bucket": bucket,
                    "max_requests": max_requests,
                    "window_seconds": window_seconds,
                },
            )
        except DBAPIError as exc:
            if "rate limit exceeded" in str(exc.orig).lower():
                raise RateLimitedError("Rate limit exceeded") from exc
            raise

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

    def finalize_successful_payment(
        self,
        *,
        order_id: uuid.UUID,
        payment_key: str,
        amount_krw: int,
        toss_response: dict[str, Any] | None,
    ) -> Payments:
        row = self._db.execute(
            text(
                """
                select *
                from public.finalize_successful_payment(
                  :order_id,
                  :payment_key,
                  :amount_krw,
                  :toss_response
                )
                """
            ),
            {
                "order_id": order_id,
                "payment_key": payment_key,
                "amount_krw": amount_krw,
                "toss_response": toss_response,
            },
        ).mappings().first()

        if row is None:
            raise NotFoundError("Payment not found")

        payment = self._db.get(Payments, row["id"])
        if payment is None:
            raise NotFoundError("Payment not found")
        return payment

    def mark_payment_failed(
        self,
        *,
        order_id: uuid.UUID,
        reason: str | None,
        toss_response: dict[str, Any] | None,
    ) -> Payments:
        row = self._db.execute(
            text(
                """
                select *
                from public.mark_payment_failed(
                  :order_id,
                  :reason,
                  :toss_response
                )
                """
            ),
            {
                "order_id": order_id,
                "reason": reason,
                "toss_response": toss_response,
            },
        ).mappings().first()

        if row is None:
            raise NotFoundError("Payment not found")

        payment = self._db.get(Payments, row["id"])
        if payment is None:
            raise NotFoundError("Payment not found")
        return payment

    def record_payment_event(
        self,
        *,
        event_id: str,
        payment_id: uuid.UUID,
        booking_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> PaymentEvents:
        row = self._db.execute(
            text(
                """
                select *
                from public.record_payment_event(
                  :event_id,
                  :payment_id,
                  :booking_id,
                  :event_type,
                  :payload
                )
                """
            ),
            {
                "event_id": event_id,
                "payment_id": payment_id,
                "booking_id": booking_id,
                "event_type": event_type,
                "payload": payload,
            },
        ).mappings().first()

        if row is None:
            raise BadRequestError("Unable to record payment event")

        event = self._db.get(PaymentEvents, row["id"])
        if event is None:
            raise BadRequestError("Unable to record payment event")
        return event

    @staticmethod
    def map_finalize_error(exc: DBAPIError) -> Exception:
        message = str(exc.orig)
        lowered = message.lower()
        if "expired" in lowered:
            return BookingExpiredError(message)
        if "mismatch" in lowered:
            return PaymentAmountMismatchError(message)
        if "not found" in lowered:
            return NotFoundError(message)
        return BadRequestError(message)

    def _get_platform_settings(self) -> PlatformSettings:
        settings = self._db.scalar(select(PlatformSettings).where(PlatformSettings.id == 1))
        if settings is None:
            raise BadRequestError("Platform settings are not configured")
        return settings
