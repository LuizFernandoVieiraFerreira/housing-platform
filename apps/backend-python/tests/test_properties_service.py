from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import BadRequestError, ForbiddenError, NotFoundError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.models import Properties
from housing_platform.properties.search_criteria import SearchPropertyRow
from housing_platform.properties.schemas import (
    HostPropertyRequest,
    PropertySearchQuery,
    PropertySearchSort,
    SetPropertyLocationRequest,
)
from housing_platform.properties.service import PropertyService


def _host_request(**overrides) -> HostPropertyRequest:
    payload = {
        "title": "Cozy Studio in Hongdae",
        "description": "A bright studio close to the subway with everything you need.",
        "propertyType": "studio",
        "addressLine1": "123 Test Street",
        "city": "Seoul",
        "district": "Mapo-gu",
        "bookingMode": "request",
        "minStayNights": 30,
    }
    payload.update(overrides)
    return HostPropertyRequest.model_validate(payload)


def _property_row(*, status: str = "draft") -> Properties:
    return Properties(
        id=uuid4(),
        host_id=uuid4(),
        title="Test Property",
        slug="test-property",
        description="A valid property description for testing.",
        property_type="studio",
        address_line1="123 Test Street",
        city="Seoul",
        country="KR",
        district="Mapo-gu",
        status=status,
        booking_mode="request",
        min_stay_nights=30,
        is_featured=False,
        tags=[],
        embedding_sync_attempts=0,
    )


def test_search_maps_rpc_rows() -> None:
    property_id = uuid4()
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    repo.search.return_value = [
        SearchPropertyRow(
            id=property_id,
            title="Studio",
            slug="studio-abc",
            property_type="studio",
            district="Mapo-gu",
            nearest_station_name="Hongdae",
            monthly_price_min=900_000,
            tags=["wifi"],
            cover_storage_path="cover.jpg",
            cover_alt_text="Cover",
            latitude=37.55,
            longitude=126.92,
            distance_meters=1200.0,
            total_count=1,
        )
    ]
    service = PropertyService(db, auth, repository=repo)

    result = service.search(PropertySearchQuery(sort=PropertySearchSort.RECOMMENDED))

    assert result.total_count == 1
    assert result.items[0].id == property_id
    assert result.items[0].monthly_price_min == 900_000


def test_search_rejects_invalid_price_range() -> None:
    db = MagicMock()
    service = PropertyService(db, AuthorizationService(db), repository=MagicMock())

    with pytest.raises(BadRequestError, match="priceMax"):
        service.search(PropertySearchQuery(price_min=500_000, price_max=100_000))


def test_get_published_property_not_found() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    repo.get_published_property.return_value = None
    service = PropertyService(db, auth, repository=repo)

    with pytest.raises(NotFoundError):
        service.get_published_property(uuid4())


def test_create_property_requires_host() -> None:
    db = MagicMock()
    auth = MagicMock()
    auth.get_host_id_for_profile.return_value = None
    repo = MagicMock()
    service = PropertyService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="user@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError, match="Host profile"):
        service.create_property(user, _host_request())


def test_create_property_commits_new_draft() -> None:
    db = MagicMock()
    host_id = uuid4()
    auth = MagicMock()
    auth.get_host_id_for_profile.return_value = host_id
    repo = MagicMock()
    created = _property_row()
    repo.create_property.return_value = created
    service = PropertyService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="host@example.com", role=UserRole.HOST)

    result = service.create_property(user, _host_request())

    assert result.id == created.id
    repo.sync_amenities.assert_called_once()
    db.commit.assert_called_once()


def test_submit_for_review_validates_requirements() -> None:
    property_id = uuid4()
    db = MagicMock()
    auth = MagicMock()
    repo = MagicMock()
    repo.get_host_property.return_value = _property_row(status="draft")
    repo.count_available_rooms.return_value = 0
    service = PropertyService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="host@example.com", role=UserRole.HOST)

    with pytest.raises(BadRequestError, match="available room"):
        service.submit_for_review(user, property_id)


def test_set_location_delegates_to_repository() -> None:
    property_id = uuid4()
    db = MagicMock()
    auth = MagicMock()
    auth.is_admin.return_value = False
    auth.is_host_of_property.return_value = True
    repo = MagicMock()
    repo.get_host_property.return_value = _property_row(status="draft")
    repo.set_location.return_value = True
    service = PropertyService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="host@example.com", role=UserRole.HOST)

    service.set_location(
        user,
        property_id,
        SetPropertyLocationRequest(latitude=37.55, longitude=126.92),
    )

    repo.set_location.assert_called_once_with(property_id, 37.55, 126.92)
    db.commit.assert_called_once()


def test_update_property_rejects_non_mutable_status_for_host() -> None:
    property_id = uuid4()
    db = MagicMock()
    auth = MagicMock()
    auth.is_admin.return_value = False
    auth.is_host_of_property.return_value = True
    repo = MagicMock()
    repo.get_host_property.return_value = _property_row(status="published")
    service = PropertyService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="host@example.com", role=UserRole.HOST)

    with pytest.raises(BadRequestError, match="draft or pending review"):
        service.update_property(user, property_id, _host_request())
