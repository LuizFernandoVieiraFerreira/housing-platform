from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import NotFoundError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.db.models import Notifications
from housing_platform.notifications.service import NotificationService


def _user() -> AuthUser:
    return AuthUser(id=uuid4(), email="user@example.com", role=UserRole.CUSTOMER)


def _notification(*, user_id=None) -> Notifications:
    return Notifications(
        id=uuid4(),
        user_id=user_id or uuid4(),
        type="booking_request",
        title="New booking request",
        body="A guest requested a booking.",
        metadata_={},
        created_at=datetime.now(UTC),
    )


def test_list_notifications_maps_rows() -> None:
    db = MagicMock()
    repo = MagicMock()
    notification = _notification(user_id=_user().id)
    repo.list_for_user.return_value = [notification]
    service = NotificationService(db, repository=repo)

    items = service.list_notifications(_user())

    assert len(items) == 1
    assert items[0].title == "New booking request"


def test_get_unread_count() -> None:
    db = MagicMock()
    repo = MagicMock()
    repo.count_unread.return_value = 5
    service = NotificationService(db, repository=repo)

    result = service.get_unread_count(_user())

    assert result.count == 5


def test_mark_read_not_found() -> None:
    db = MagicMock()
    repo = MagicMock()
    repo.mark_read.return_value = None
    service = NotificationService(db, repository=repo)

    with pytest.raises(NotFoundError):
        service.mark_read(_user(), uuid4())


def test_mark_all_read_returns_count() -> None:
    db = MagicMock()
    repo = MagicMock()
    repo.mark_all_read.return_value = 3
    service = NotificationService(db, repository=repo)

    result = service.mark_all_read(_user())

    assert result.updated_count == 3
    db.commit.assert_called_once()
