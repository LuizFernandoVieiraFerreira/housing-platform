import uuid
from typing import Any

from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from housing_platform.auth.errors import (
    BadRequestError,
    ExternalServiceError,
    ForbiddenError,
    NotFoundError,
    PaymentAmountMismatchError,
    PaymentFailedError,
)
from housing_platform.auth.models import AuthUser
from housing_platform.payments.mappers import (
    map_confirm_payment_result,
    map_create_payment_order_result,
)
from housing_platform.payments.repository import PaymentRepository
from housing_platform.payments.schemas import (
    ConfirmPaymentRequest,
    ConfirmPaymentResult,
    CreatePaymentOrderRequest,
    CreatePaymentOrderResult,
    PaymentStatus,
    TossWebhookPayload,
    WebhookAck,
    WebhookAckStatus,
)
from housing_platform.payments.toss_client import TossClient, TossClientError


class PaymentService:
    def __init__(
        self,
        db: Session,
        repository: PaymentRepository | None = None,
        toss_client: TossClient | None = None,
    ) -> None:
        self._db = db
        self._repo = repository or PaymentRepository(db)
        self._toss = toss_client or TossClient()

    def create_payment_order(
        self,
        user: AuthUser,
        request: CreatePaymentOrderRequest,
    ) -> CreatePaymentOrderResult:
        self._repo.assert_rate_limit(f"create-payment:{user.id}", 20, 60)

        order = self._repo.create_payment_order(request.booking_id, user.id)
        self._db.commit()

        return map_create_payment_order_result(
            payment_id=order.payment_id,
            order_id=order.order_id,
            booking_id=order.booking_id,
            amount_krw=order.amount_krw,
            order_name=order.order_name,
        )

    def confirm_payment(
        self,
        user: AuthUser,
        request: ConfirmPaymentRequest,
    ) -> ConfirmPaymentResult:
        self._repo.assert_rate_limit(f"confirm-payment:{user.id}", 20, 60)

        payment = self._repo.get_payment_by_order_id(request.order_id)
        if payment is None:
            raise NotFoundError("Payment not found")

        if payment.customer_id != user.id:
            raise ForbiddenError("You cannot confirm this payment")

        if payment.amount_krw != request.amount:
            raise PaymentAmountMismatchError("Payment amount does not match booking total")

        if payment.status == "confirmed":
            return ConfirmPaymentResult(
                payment_id=payment.id,
                order_id=payment.order_id,
                booking_id=None,
                status=PaymentStatus.CONFIRMED,
            )

        toss_response: dict[str, Any] | None = None

        try:
            toss_response = self._toss.confirm_payment(
                payment_key=request.payment_key,
                order_id=str(request.order_id),
                amount=request.amount,
            )
        except TossClientError as exc:
            self._repo.mark_payment_failed(
                order_id=request.order_id,
                reason=str(exc),
                toss_response=toss_response,
            )
            self._db.commit()
            raise PaymentFailedError(str(exc)) from exc

        if not self._toss.is_successful(toss_response):
            reason = str(toss_response.get("status", "Payment not completed"))
            self._repo.mark_payment_failed(
                order_id=request.order_id,
                reason=reason,
                toss_response=toss_response,
            )
            self._db.commit()
            raise PaymentFailedError("Payment was not completed")

        try:
            finalized = self._repo.finalize_successful_payment(
                order_id=request.order_id,
                payment_key=request.payment_key,
                amount_krw=request.amount,
                toss_response=toss_response,
            )
        except DBAPIError as exc:
            mapped = self._repo.map_finalize_error(exc)
            raise mapped from exc

        self._db.commit()
        self._db.refresh(finalized)
        return map_confirm_payment_result(finalized)

    def receive_webhook(self, payload: TossWebhookPayload) -> WebhookAck:
        if self._toss.is_dev_mock_enabled() and not self._toss.has_secret_key():
            return WebhookAck(ok=True, status=WebhookAckStatus.IGNORED)

        data = payload.data or {}
        payment_key = str(data.get("paymentKey", ""))
        order_id_raw = str(data.get("orderId", ""))

        if not payment_key or not order_id_raw:
            raise BadRequestError("Webhook payload missing paymentKey or orderId")

        try:
            order_id = uuid.UUID(order_id_raw)
        except ValueError as exc:
            raise BadRequestError("Webhook payload missing paymentKey or orderId") from exc

        event_id = (
            f"{payload.event_type or 'UNKNOWN'}:{payment_key}:{payload.created_at or 'unknown'}"
        )

        payment = self._repo.get_payment_by_order_id(order_id)
        if payment is None:
            raise NotFoundError("Payment not found")

        self._repo.record_payment_event(
            event_id=event_id,
            payment_id=payment.id,
            booking_id=payment.booking_id,
            event_type=payload.event_type or "UNKNOWN",
            payload=payload.model_dump(by_alias=True),
        )

        if payment.status == "confirmed":
            self._db.commit()
            return WebhookAck(ok=True, status=WebhookAckStatus.ALREADY_CONFIRMED)

        try:
            toss_payment = self._toss.fetch_payment(payment_key)
        except TossClientError as exc:
            raise ExternalServiceError(str(exc)) from exc

        if self._toss.is_successful(toss_payment):
            amount = int(toss_payment.get("totalAmount", payment.amount_krw))
            try:
                self._repo.finalize_successful_payment(
                    order_id=order_id,
                    payment_key=payment_key,
                    amount_krw=amount,
                    toss_response=toss_payment,
                )
            except DBAPIError as exc:
                mapped = self._repo.map_finalize_error(exc)
                raise mapped from exc

            self._db.commit()
            return WebhookAck(ok=True, status=WebhookAckStatus.CONFIRMED)

        if self._toss.is_failed(toss_payment):
            self._repo.mark_payment_failed(
                order_id=order_id,
                reason=str(toss_payment.get("status", "Payment failed")),
                toss_response=toss_payment,
            )
            self._db.commit()
            return WebhookAck(ok=True, status=WebhookAckStatus.FAILED)

        self._db.commit()
        return WebhookAck(ok=True, status=WebhookAckStatus.IGNORED)
