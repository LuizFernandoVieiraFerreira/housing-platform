import uuid

from sqlalchemy.orm import Session

from housing_platform.auth.errors import BadRequestError, ForbiddenError, NotFoundError
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.hosts.mappers import map_host, map_host_booking, map_host_property_list_item
from housing_platform.hosts.repository import HostRepository
from housing_platform.hosts.schemas import (
    Host,
    HostBooking,
    HostPropertyListItem,
    RegisterHostRequest,
)
from housing_platform.properties.mappers import map_host_property_detail
from housing_platform.properties.repository import PropertyRepository
from housing_platform.properties.schemas import HostPropertyDetail


class HostService:
    def __init__(
        self,
        db: Session,
        auth_service: AuthorizationService,
        repository: HostRepository | None = None,
        property_repository: PropertyRepository | None = None,
    ) -> None:
        self._db = db
        self._auth = auth_service
        self._repo = repository or HostRepository(db)
        self._properties = property_repository or PropertyRepository(db)

    def register(self, user: AuthUser, request: RegisterHostRequest) -> Host:
        display_name = request.display_name.strip()
        if not display_name:
            raise BadRequestError("Display name is required")

        host = self._repo.register(user.id, display_name)
        self._db.commit()
        self._db.refresh(host)
        return map_host(host)

    def get_current_host(self, user: AuthUser) -> Host | None:
        host = self._repo.get_by_profile_id(user.id)
        if host is None:
            return None
        return map_host(host)

    def list_properties(self, user: AuthUser) -> list[HostPropertyListItem]:
        host_id = self._require_host_id(user)
        rows = self._repo.list_properties(host_id)
        return [
            map_host_property_list_item(
                property_id=row.id,
                title=row.title,
                slug=row.slug,
                property_type=row.property_type,
                district=row.district,
                status=row.status,
                booking_mode=row.booking_mode,
                monthly_price_min=row.monthly_price_min,
                room_count=row.room_count,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

    def get_property(self, user: AuthUser, property_id: uuid.UUID) -> HostPropertyDetail:
        host_id = self._require_host_id(user)
        if not self._repo.property_belongs_to_host(host_id, property_id):
            raise NotFoundError("Property not found")

        property_row = self._properties.get_host_property(property_id)
        if property_row is None:
            raise NotFoundError("Property not found")

        coordinates = self._properties.get_coordinates(property_id)
        amenity_ids = self._properties.get_property_amenity_ids(property_id)
        return map_host_property_detail(
            property_row,
            latitude=coordinates.latitude if coordinates else None,
            longitude=coordinates.longitude if coordinates else None,
            amenity_ids=amenity_ids,
        )

    def list_bookings(self, user: AuthUser) -> list[HostBooking]:
        host_id = self._require_host_id(user)
        rows = self._repo.list_bookings(host_id)
        return [
            map_host_booking(
                booking_id=row.id,
                status=row.status,
                booking_type=row.booking_type,
                check_in=row.check_in,
                check_out=row.check_out,
                guest_count=row.guest_count,
                customer_notes=row.customer_notes,
                property_title=row.property_title,
                room_name=row.room_name,
                total_krw=row.total_krw,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def _require_host_id(self, user: AuthUser) -> uuid.UUID:
        host_id = self._auth.get_host_id_for_profile(user.id)
        if host_id is None:
            raise ForbiddenError("Host profile is required")
        return host_id
