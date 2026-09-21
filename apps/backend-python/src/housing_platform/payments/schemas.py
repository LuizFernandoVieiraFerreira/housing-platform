from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PaymentStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CreatePaymentOrderRequest(CamelModel):
    booking_id: UUID


class CreatePaymentOrderResult(CamelModel):
    payment_id: UUID
    order_id: UUID
    booking_id: UUID
    amount_krw: Annotated[int, Field(ge=1)]
    order_name: str


class ConfirmPaymentRequest(CamelModel):
    payment_key: Annotated[str, Field(min_length=1)]
    order_id: UUID
    amount: Annotated[int, Field(ge=1)]


class ConfirmPaymentResult(CamelModel):
    payment_id: UUID
    order_id: UUID
    booking_id: UUID | None
    status: PaymentStatus


class TossWebhookPayload(CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="allow",
    )

    event_type: str | None = None
    created_at: str | None = None
    data: dict[str, Any] | None = None


class WebhookAckStatus(StrEnum):
    CONFIRMED = "confirmed"
    FAILED = "failed"
    IGNORED = "ignored"
    ALREADY_CONFIRMED = "already_confirmed"


class WebhookAck(CamelModel):
    ok: bool
    status: WebhookAckStatus
