from datetime import date, datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import Field

from housing_platform.bookings.schemas import BookingStatus, BookingType, CamelModel
from housing_platform.properties.schemas import AccommodationType, BookingMode, PropertyStatus


class HostStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class RegisterHostRequest(CamelModel):
    display_name: Annotated[str, Field(min_length=1, max_length=120)]


class Host(CamelModel):
    id: UUID
    profile_id: UUID
    display_name: str
    status: HostStatus
    verified_at: datetime | None
    created_at: datetime
    updated_at: datetime


class HostPropertyListItem(CamelModel):
    id: UUID
    title: str
    slug: str
    property_type: AccommodationType
    district: str
    status: PropertyStatus
    booking_mode: BookingMode
    monthly_price_min: int | None
    room_count: Annotated[int, Field(ge=0)]
    updated_at: datetime


class HostBooking(CamelModel):
    id: UUID
    status: BookingStatus
    booking_type: BookingType
    check_in: date
    check_out: date
    guest_count: Annotated[int, Field(ge=1)]
    customer_notes: str | None
    property_title: str
    room_name: str
    total_krw: Annotated[int, Field(ge=0)]
    created_at: datetime
