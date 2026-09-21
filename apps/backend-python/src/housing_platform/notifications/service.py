import uuid

from sqlalchemy.orm import Session

from housing_platform.auth.errors import NotFoundError
from housing_platform.auth.models import AuthUser
from housing_platform.notifications.mappers import map_notification
from housing_platform.notifications.repository import NotificationRepository
from housing_platform.notifications.schemas import (
    MarkAllNotificationsReadResult,
    Notification,
    UnreadNotificationCount,
)


class NotificationService:
    def __init__(
        self,
        db: Session,
        repository: NotificationRepository | None = None,
    ) -> None:
        self._db = db
        self._repo = repository or NotificationRepository(db)

    def list_notifications(self, user: AuthUser) -> list[Notification]:
        rows = self._repo.list_for_user(user.id)
        return [map_notification(row) for row in rows]

    def get_unread_count(self, user: AuthUser) -> UnreadNotificationCount:
        return UnreadNotificationCount(count=self._repo.count_unread(user.id))

    def mark_read(self, user: AuthUser, notification_id: uuid.UUID) -> Notification:
        notification = self._repo.mark_read(user.id, notification_id)
        if notification is None:
            raise NotFoundError("Notification not found")

        self._db.commit()
        self._db.refresh(notification)
        return map_notification(notification)

    def mark_all_read(self, user: AuthUser) -> MarkAllNotificationsReadResult:
        updated_count = self._repo.mark_all_read(user.id)
        self._db.commit()
        return MarkAllNotificationsReadResult(updated_count=updated_count)
