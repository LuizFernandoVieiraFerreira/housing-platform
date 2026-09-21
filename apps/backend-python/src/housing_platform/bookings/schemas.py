from datetime import date, datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class BookingStatus(StrEnum):
    REQUESTED = "requested"
    PENDING_PAYMENT = "pending_payment"
    EXPIRED = "expired"
    CONFIRMED = "confirmed"
    PAYMENT_FAILED = "payment_failed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class BookingType(StrEnum):
    INSTANT = "instant"
    REQUEST = "request"


class BookingMode(StrEnum):
    INSTANT = "instant"
    REQUEST = "request"


class BookingQuoteQuery(CamelModel):
    room_id: UUID
    check_in: date
    check_out: date
    guest_count: Annotated[int, Field(ge=1, le=20)]


class BookingQuote(CamelModel):
    room_id: UUID
    property_id: UUID
    booking_mode: BookingMode
    nights: Annotated[int, Field(ge=1)]
    rent_krw: Annotated[int, Field(ge=0)]
    service_fee_krw: Annotated[int, Field(ge=0)]
    total_krw: Annotated[int, Field(ge=0)]
    pricing_version: str


class CreateBookingRequest(CamelModel):
    room_id: UUID
    check_in: date
    check_out: date
    guest_count: Annotated[int, Field(ge=1, le=20)]
    customer_notes: Annotated[str | None, Field(max_length=500)] = None


class Booking(CamelModel):
    id: UUID
    customer_id: UUID
    room_id: UUID
    property_id: UUID
    check_in: date
    check_out: date
    guest_count: Annotated[int, Field(ge=1)]
    status: BookingStatus
    booking_type: BookingType
    hold_expires_at: datetime | None
    customer_notes: str | None
    approved_at: datetime | None
    approved_by: UUID | None
    cancelled_at: datetime | None
    payment_retry_count: Annotated[int, Field(ge=0)]
    created_at: datetime
    updated_at: datetime


class BookingListItem(CamelModel):
    id: UUID
    status: BookingStatus
    booking_type: BookingType
    check_in: date
    check_out: date
    guest_count: Annotated[int, Field(ge=1)]
    property_title: str
    district: str
    room_name: str
    total_krw: Annotated[int, Field(ge=0)]
    hold_expires_at: datetime | None
    created_at: datetime


class BookingDetail(BookingListItem):
    customer_notes: str | None
    rent_krw: Annotated[int, Field(ge=0)]
    service_fee_krw: Annotated[int, Field(ge=0)]
    service_fee_percent: Annotated[float, Field(ge=0)]
    pricing_version: str
    property_id: UUID
    room_id: UUID
