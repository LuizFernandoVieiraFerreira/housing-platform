from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.admin.repository import AdminPropertyRow
from housing_platform.admin.schemas import HousingRequestStatus, UpdateHousingRequestStatusRequest
from housing_platform.admin.service import AdminService
from housing_platform.auth.errors import BadRequestError, ForbiddenError, NotFoundError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.models import Properties


def _user(*, role: UserRole = UserRole.ADMIN) -> AuthUser:
    return AuthUser(id=uuid4(), email="admin@example.com", role=role)


def test_dashboard_stats_requires_admin() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=False)
    service = AdminService(db, auth, repository=MagicMock())

    with pytest.raises(ForbiddenError):
        service.get_dashboard_stats(_user(role=UserRole.CUSTOMER))


def test_dashboard_stats_returns_counts() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    repo = MagicMock()
    repo.get_dashboard_stats.return_value = {
        "pending_properties": 2,
        "pending_hosts": 1,
        "open_bookings": 3,
        "open_housing_requests": 4,
    }
    service = AdminService(db, auth, repository=repo)

    stats = service.get_dashboard_stats(_user())

    assert stats.pending_properties == 2
    assert stats.open_housing_requests == 4


def test_publish_property_requires_pending_review() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    repo = MagicMock()
    repo.publish_property.return_value = None
    service = AdminService(db, auth, repository=repo)

    with pytest.raises(BadRequestError, match="pending review"):
        service.publish_property(_user(), uuid4())


def test_publish_property_writes_audit_log() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    property_row = Properties(
        id=uuid4(),
        host_id=uuid4(),
        title="Test",
        slug="test",
        description="A valid property description.",
        property_type="studio",
        address_line1="123 Street",
        city="Seoul",
        country="KR",
        district="Mapo-gu",
        status="published",
        booking_mode="request",
        min_stay_nights=30,
        is_featured=False,
        tags=[],
        embedding_sync_attempts=0,
    )
    repo = MagicMock()
    repo.publish_property.return_value = property_row
    service = AdminService(db, auth, repository=repo)

    result = service.publish_property(_user(), property_row.id)

    assert result.status.value == "published"
    repo.write_audit_log.assert_called_once()
    db.commit.assert_called_once()


def test_approve_host_requires_pending_status() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    repo = MagicMock()
    repo.approve_host.return_value = None
    service = AdminService(db, auth, repository=repo)

    with pytest.raises(BadRequestError, match="pending"):
        service.approve_host(_user(), uuid4())


def test_list_properties_maps_admin_rows() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    repo = MagicMock()
    repo.list_properties.return_value = [
        AdminPropertyRow(
            id=uuid4(),
            title="Studio",
            slug="studio-abc",
            property_type="studio",
            district="Mapo-gu",
            status="pending_review",
            booking_mode="request",
            monthly_price_min=900_000,
            room_count=1,
            updated_at=datetime.now(UTC),
            host_display_name="Host One",
        )
    ]
    service = AdminService(db, auth, repository=repo)

    items = service.list_properties(_user())

    assert items[0].host_display_name == "Host One"


def test_update_housing_request_not_found() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.is_admin = MagicMock(return_value=True)
    repo = MagicMock()
    repo.update_housing_request_status.return_value = None
    service = AdminService(db, auth, repository=repo)

    with pytest.raises(NotFoundError):
        service.update_housing_request_status(
            _user(),
            uuid4(),
            UpdateHousingRequestStatusRequest(status=HousingRequestStatus.CLOSED),
        )
