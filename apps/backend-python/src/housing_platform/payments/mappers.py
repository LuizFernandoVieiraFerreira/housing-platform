import uuid

from housing_platform.db.models import Payments
from housing_platform.payments.schemas import (
    ConfirmPaymentResult,
    CreatePaymentOrderResult,
    PaymentStatus,
)


def map_create_payment_order_result(
    *,
    payment_id: uuid.UUID,
    order_id: uuid.UUID,
    booking_id: uuid.UUID,
    amount_krw: int,
    order_name: str,
) -> CreatePaymentOrderResult:
    return CreatePaymentOrderResult(
        payment_id=payment_id,
        order_id=order_id,
        booking_id=booking_id,
        amount_krw=amount_krw,
        order_name=order_name,
    )


def map_confirm_payment_result(
    payment: Payments,
    *,
    booking_id: uuid.UUID | None = None,
) -> ConfirmPaymentResult:
    return ConfirmPaymentResult(
        payment_id=payment.id,
        order_id=payment.order_id,
        booking_id=booking_id if booking_id is not None else payment.booking_id,
        status=PaymentStatus(payment.status),
    )
