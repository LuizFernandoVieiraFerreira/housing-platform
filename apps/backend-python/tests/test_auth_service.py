from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import ForbiddenError, UnauthenticatedError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.models import Hosts, Profiles, Properties


def _profile(*, role: str = "customer") -> Profiles:
    profile = Profiles(
        id=uuid4(),
        role=role,
        full_name="Test User",
        preferred_language="en",
        marketing_consent=False,
    )
    profile.deleted_at = None
    return profile


def test_resolve_auth_user_returns_profile_role() -> None:
    profile = _profile(role="host")
    db = MagicMock()
    db.scalar.return_value = profile
    service = AuthorizationService(db)

    user = service.resolve_auth_user(profile.id, "host@example.com")

    assert user == AuthUser(id=profile.id, email="host@example.com", role=UserRole.HOST)


def test_resolve_auth_user_rejects_missing_profile() -> None:
    db = MagicMock()
    db.scalar.return_value = None
    service = AuthorizationService(db)

    with pytest.raises(UnauthenticatedError, match="profile not found"):
        service.resolve_auth_user(uuid4(), None)


def test_is_admin_checks_deleted_at() -> None:
    db = MagicMock()
    db.scalar.return_value = True
    service = AuthorizationService(db)

    assert service.is_admin(uuid4()) is True


def test_require_admin_raises_for_non_admin() -> None:
    db = MagicMock()
    db.scalar.return_value = False
    service = AuthorizationService(db)
    user = AuthUser(id=uuid4(), email="user@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError, match="Admin access required"):
        service.require_admin(user)


def test_get_host_id_for_profile_returns_scalar() -> None:
    host_id = uuid4()
    db = MagicMock()
    db.scalar.return_value = host_id
    service = AuthorizationService(db)

    assert service.get_host_id_for_profile(uuid4()) == host_id


def test_is_host_of_property_uses_exists_query() -> None:
    db = MagicMock()
    db.scalar.return_value = True
    service = AuthorizationService(db)

    assert service.is_host_of_property(uuid4(), uuid4()) is True


def test_is_host_of_booking_returns_false_when_booking_missing() -> None:
    db = MagicMock()
    db.scalar.side_effect = [None]
    service = AuthorizationService(db)

    assert service.is_host_of_booking(uuid4(), uuid4()) is False


def test_is_host_of_booking_delegates_to_property_check() -> None:
    property_id = uuid4()
    user_id = uuid4()
    db = MagicMock()
    db.scalar.side_effect = [property_id, True]
    service = AuthorizationService(db)

    assert service.is_host_of_booking(user_id, uuid4()) is True


def test_require_host_of_property_raises_for_non_host() -> None:
    db = MagicMock()
    db.scalar.return_value = False
    service = AuthorizationService(db)
    user = AuthUser(id=uuid4(), email="user@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError, match="host of this property"):
        service.require_host_of_property(user, uuid4())


def test_require_host_of_booking_allows_admin() -> None:
    db = MagicMock()
    db.scalar.side_effect = [True]
    service = AuthorizationService(db)
    admin = AuthUser(id=uuid4(), email="admin@example.com", role=UserRole.ADMIN)

    service.require_host_of_booking(admin, uuid4())


@pytest.mark.integration
def test_authorization_service_against_database() -> None:
    from sqlalchemy import select

    from housing_platform.db.session import SessionLocal

    with SessionLocal() as db:
        profile = db.scalar(
            select(Profiles).where(Profiles.deleted_at.is_(None)).limit(1)
        )
        if profile is None:
            pytest.skip("No profiles available in the database")

        service = AuthorizationService(db)
        user = service.resolve_auth_user(profile.id, "integration@example.com")

        assert user.id == profile.id
        assert user.role.value == profile.role

        if profile.role == "admin":
            assert service.is_admin(profile.id) is True

        host = db.scalar(
            select(Hosts).where(
                Hosts.profile_id == profile.id,
                Hosts.deleted_at.is_(None),
            )
        )
        if host is not None:
            property_row = db.scalar(
                select(Properties).where(
                    Properties.host_id == host.id,
                    Properties.deleted_at.is_(None),
                )
            )
            if property_row is not None:
                assert service.is_host_of_property(profile.id, property_row.id) is True
                assert service.get_host_id_for_profile(profile.id) == host.id
