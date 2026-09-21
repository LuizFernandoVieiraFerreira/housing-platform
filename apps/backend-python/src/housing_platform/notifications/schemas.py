from datetime import datetime
from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from pydantic import Field

from housing_platform.payments.schemas import CamelModel


class NotificationType(StrEnum):
    BOOKING_REQUEST = "booking_request"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REJECTED = "booking_rejected"


class Notification(CamelModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    body: str
    metadata: dict[str, Any]
    read_at: datetime | None
    created_at: datetime


class UnreadNotificationCount(CamelModel):
    count: Annotated[int, Field(ge=0)]


class MarkAllNotificationsReadResult(CamelModel):
    updated_count: Annotated[int, Field(ge=0)]
