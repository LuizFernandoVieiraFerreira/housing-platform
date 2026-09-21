from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import NotFoundError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.db.models import Profiles
from housing_platform.profile.schemas import UpdateProfileRequest
from housing_platform.profile.service import ProfileService


def _user() -> AuthUser:
    return AuthUser(id=uuid4(), email="user@example.com", role=UserRole.CUSTOMER)


def _profile(*, profile_id=None) -> Profiles:
    return Profiles(
        id=profile_id or uuid4(),
        role="customer",
        full_name="Jane Doe",
        preferred_language="en",
        marketing_consent=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def test_get_profile_not_found() -> None:
    db = MagicMock()
    repo = MagicMock()
    repo.get_by_id.return_value = None
    service = ProfileService(db, repository=repo)

    with pytest.raises(NotFoundError):
        service.get_profile(_user())


def test_get_profile_returns_mapped_profile() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock()
    repo.get_by_id.return_value = _profile(profile_id=user.id)
    service = ProfileService(db, repository=repo)

    profile = service.get_profile(user)

    assert profile.full_name == "Jane Doe"
    assert profile.role == UserRole.CUSTOMER


def test_update_profile_commits_changes() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock()
    updated = _profile(profile_id=user.id)
    updated.full_name = "Jane Smith"
    repo.update.return_value = updated
    service = ProfileService(db, repository=repo)

    result = service.update_profile(
        user,
        UpdateProfileRequest(
            full_name="Jane Smith",
            preferred_language="ko",
            marketing_consent=True,
        ),
    )

    assert result.full_name == "Jane Smith"
    db.commit.assert_called_once()
