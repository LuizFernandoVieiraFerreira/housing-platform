from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from pydantic import Field

from housing_platform.hosts.schemas import HostPropertyListItem
from housing_platform.payments.schemas import CamelModel, PaymentStatus


class HousingRequestStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class AdminDashboardStats(CamelModel):
    pending_properties: Annotated[int, Field(ge=0)]
    pending_hosts: Annotated[int, Field(ge=0)]
    open_bookings: Annotated[int, Field(ge=0)]
    open_housing_requests: Annotated[int, Field(ge=0)]


class AdminHost(CamelModel):
    id: UUID
    display_name: str
    status: str
    profile_name: str
    verified_at: datetime | None
    created_at: datetime


class AdminProperty(HostPropertyListItem):
    host_display_name: str


class AdminPayment(CamelModel):
    id: UUID
    order_id: UUID
    booking_id: UUID
    amount_krw: Annotated[int, Field(ge=0)]
    status: PaymentStatus
    property_title: str | None
    customer_name: str | None
    confirmed_at: datetime | None
    created_at: datetime


class HousingRequest(CamelModel):
    id: UUID
    email: str
    desired_area: str
    check_in: date | None
    check_out: date | None
    budget_max: int | None
    accommodation_type: str | None
    notes: str | None
    status: HousingRequestStatus
    created_at: datetime


class UpdateHousingRequestStatusRequest(CamelModel):
    status: HousingRequestStatus


class AuditLog(CamelModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None
    actor_name: str
    metadata: dict[str, Any]
    created_at: datetime
