from housing_platform.db.models import Notifications
from housing_platform.notifications.schemas import Notification, NotificationType


def map_notification(notification: Notifications) -> Notification:
    return Notification(
        id=notification.id,
        user_id=notification.user_id,
        type=NotificationType(notification.type),
        title=notification.title,
        body=notification.body,
        metadata=notification.metadata_ or {},
        read_at=notification.read_at,
        created_at=notification.created_at,
    )
