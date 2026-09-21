import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from housing_platform.auth.errors import (
    BadRequestError,
    BookingExpiredError,
    NotFoundError,
    PaymentAmountMismatchError,
)
from housing_platform.db.models import Bookings, PaymentEvents, Payments


class PaymentFinalizationService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def finalize_successful_payment(
        self,
        *,
        order_id: uuid.UUID,
        payment_key: str,
        amount_krw: int,
        toss_response: dict[str, Any] | None,
    ) -> Payments:
        payment = self._db.scalar(
            select(Payments).where(Payments.order_id == order_id).with_for_update()
        )
        if payment is None:
            raise NotFoundError("Payment not found")

        if payment.status == "confirmed":
            return payment

        if payment.amount_krw != amount_krw:
            raise PaymentAmountMismatchError("Payment amount mismatch")

        booking = self._db.scalar(
            select(Bookings).where(Bookings.id == payment.booking_id).with_for_update()
        )
        if booking is None:
            raise NotFoundError("Booking not found")

        if booking.status == "confirmed":
            payment.status = "confirmed"
            payment.payment_key = payment_key
            if toss_response is not None:
                payment.toss_response = toss_response
            if payment.confirmed_at is None:
                payment.confirmed_at = datetime.now(UTC)
            self._db.flush()
            return payment

        if booking.status != "pending_payment":
            raise BadRequestError("Booking is not awaiting payment")

        now = datetime.now(UTC)
        if booking.hold_expires_at is not None and booking.hold_expires_at <= now:
            booking.status = "expired"
            self._db.flush()
            raise BookingExpiredError("Booking hold has expired")

        payment.status = "confirmed"
        payment.payment_key = payment_key
        payment.toss_response = toss_response
        payment.confirmed_at = now
        booking.status = "confirmed"
        self._db.flush()
        return payment

    def mark_payment_failed(
        self,
        *,
        order_id: uuid.UUID,
        reason: str | None,
        toss_response: dict[str, Any] | None,
    ) -> Payments:
        payment = self._db.scalar(
            select(Payments).where(Payments.order_id == order_id).with_for_update()
        )
        if payment is None:
            raise NotFoundError("Payment not found")

        if payment.status == "confirmed":
            return payment

        trimmed_reason = reason.strip() if reason else None
        payment.status = "failed"
        payment.failed_reason = trimmed_reason if trimmed_reason else None
        if toss_response is not None:
            payment.toss_response = toss_response

        booking = self._db.scalar(select(Bookings).where(Bookings.id == payment.booking_id))
        if booking is not None and booking.status in ("pending_payment", "payment_failed"):
            booking.status = "payment_failed"

        self._db.flush()
        return payment

    def record_payment_event(
        self,
        *,
        event_id: str,
        payment_id: uuid.UUID,
        booking_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> PaymentEvents | None:
        existing = self._db.scalar(
            select(PaymentEvents).where(PaymentEvents.event_id == event_id)
        )
        if existing is not None:
            return existing

        stmt = (
            insert(PaymentEvents)
            .values(
                event_id=event_id,
                payment_id=payment_id,
                booking_id=booking_id,
                event_type=event_type,
                payload=payload,
            )
            .on_conflict_do_nothing(index_elements=[PaymentEvents.event_id])
            .returning(PaymentEvents)
        )
        inserted = self._db.scalar(stmt)
        if inserted is not None:
            return inserted

        return self._db.scalar(select(PaymentEvents).where(PaymentEvents.event_id == event_id))
