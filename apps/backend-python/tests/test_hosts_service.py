from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import BadRequestError, ForbiddenError, NotFoundError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.models import Hosts
from housing_platform.hosts.repository import HostPropertyListRow
from housing_platform.hosts.schemas import RegisterHostRequest
from housing_platform.hosts.service import HostService


def _user(*, role: UserRole = UserRole.CUSTOMER) -> AuthUser:
    return AuthUser(id=uuid4(), email="host@example.com", role=role)


def _host(*, profile_id=None) -> Hosts:
    return Hosts(
        id=uuid4(),
        profile_id=profile_id or uuid4(),
        display_name="Test Host",
        status="pending",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def test_register_returns_existing_host() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    existing = _host()
    repo.register.return_value = existing
    service = HostService(db, auth, repository=repo)

    result = service.register(_user(), RegisterHostRequest(display_name="Test Host"))

    assert result.id == existing.id
    db.commit.assert_called_once()


def test_register_rejects_blank_display_name() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    service = HostService(db, auth, repository=MagicMock())

    with pytest.raises(BadRequestError, match="Display name is required"):
        service.register(_user(), RegisterHostRequest(display_name="   "))


def test_get_current_host_returns_none_when_missing() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    repo.get_by_profile_id.return_value = None
    service = HostService(db, auth, repository=repo)

    assert service.get_current_host(_user()) is None


def test_list_properties_requires_host_profile() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    auth.get_host_id_for_profile = MagicMock(return_value=None)
    service = HostService(db, auth, repository=MagicMock())

    with pytest.raises(ForbiddenError, match="Host profile is required"):
        service.list_properties(_user())


def test_list_properties_maps_rows() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    host_id = uuid4()
    auth.get_host_id_for_profile = MagicMock(return_value=host_id)
    repo = MagicMock()
    repo.list_properties.return_value = [
        HostPropertyListRow(
            id=uuid4(),
            title="Studio",
            slug="studio-abc",
            property_type="studio",
            district="Mapo-gu",
            status="draft",
            booking_mode="request",
            monthly_price_min=900_000,
            room_count=1,
            updated_at=datetime.now(UTC),
        )
    ]
    service = HostService(db, auth, repository=repo)

    items = service.list_properties(_user())

    assert len(items) == 1
    assert items[0].title == "Studio"


def test_get_property_not_found_for_other_host() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    host_id = uuid4()
    auth.get_host_id_for_profile = MagicMock(return_value=host_id)
    repo = MagicMock()
    repo.property_belongs_to_host.return_value = False
    service = HostService(db, auth, repository=repo)

    with pytest.raises(NotFoundError, match="Property not found"):
        service.get_property(_user(), uuid4())
