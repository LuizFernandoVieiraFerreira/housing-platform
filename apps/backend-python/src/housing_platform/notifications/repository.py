import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from housing_platform.db.models import Notifications


class NotificationRepository:
    LIST_LIMIT = 50

    def __init__(self, db: Session) -> None:
        self._db = db

    def list_for_user(self, user_id: uuid.UUID) -> list[Notifications]:
        return list(
            self._db.scalars(
                select(Notifications)
                .where(Notifications.user_id == user_id)
                .order_by(Notifications.created_at.desc())
                .limit(self.LIST_LIMIT)
            ).all()
        )

    def count_unread(self, user_id: uuid.UUID) -> int:
        return (
            self._db.scalar(
                select(func.count())
                .select_from(Notifications)
                .where(
                    Notifications.user_id == user_id,
                    Notifications.read_at.is_(None),
                )
            )
            or 0
        )

    def mark_read(self, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notifications | None:
        now = datetime.now(UTC)
        updated = self._db.scalar(
            update(Notifications)
            .where(
                Notifications.id == notification_id,
                Notifications.user_id == user_id,
                Notifications.read_at.is_(None),
            )
            .values(read_at=now)
            .returning(Notifications)
        )
        if updated is not None:
            return updated

        return self._db.scalar(
            select(Notifications).where(
                Notifications.id == notification_id,
                Notifications.user_id == user_id,
            )
        )

    def mark_all_read(self, user_id: uuid.UUID) -> int:
        now = datetime.now(UTC)
        result = self._db.execute(
            update(Notifications)
            .where(
                Notifications.user_id == user_id,
                Notifications.read_at.is_(None),
            )
            .values(read_at=now)
        )
        return result.rowcount or 0
