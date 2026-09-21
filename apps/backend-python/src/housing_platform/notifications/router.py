from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import get_current_user
from housing_platform.auth.models import AuthUser
from housing_platform.db.session import get_db
from housing_platform.notifications.schemas import (
    MarkAllNotificationsReadResult,
    Notification,
    UnreadNotificationCount,
)
from housing_platform.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=list[Notification])
def list_notifications(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: NotificationService = Depends(get_notification_service),
) -> list[Notification]:
    return service.list_notifications(user)


@router.get("/unread-count", response_model=UnreadNotificationCount)
def get_unread_notification_count(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: NotificationService = Depends(get_notification_service),
) -> UnreadNotificationCount:
    return service.get_unread_count(user)


@router.post("/{notification_id}/read", response_model=Notification)
def mark_notification_read(
    notification_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: NotificationService = Depends(get_notification_service),
) -> Notification:
    return service.mark_read(user, notification_id)


@router.post("/read-all", response_model=MarkAllNotificationsReadResult)
def mark_all_notifications_read(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: NotificationService = Depends(get_notification_service),
) -> MarkAllNotificationsReadResult:
    return service.mark_all_read(user)
