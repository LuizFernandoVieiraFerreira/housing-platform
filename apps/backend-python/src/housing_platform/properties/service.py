import uuid

from sqlalchemy.orm import Session

from housing_platform.auth.errors import BadRequestError, ForbiddenError, NotFoundError
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.properties.mappers import (
    create_property_slug,
    map_host_property_detail,
    map_property_detail,
    map_search_property_card,
    normalize_tags,
    request_to_property_fields,
)
from housing_platform.properties.repository import PropertyRepository
from housing_platform.properties.search_criteria import to_search_criteria
from housing_platform.properties.schemas import (
    CreatedId,
    HostPropertyDetail,
    HostPropertyRequest,
    PropertyDetail,
    PropertySearchQuery,
    PropertySearchResult,
    PropertyStatus,
    PropertyStatusChange,
    SetPropertyLocationRequest,
)


class PropertyService:
    def __init__(
        self,
        db: Session,
        auth_service: AuthorizationService,
        repository: PropertyRepository | None = None,
    ) -> None:
        self._db = db
        self._auth = auth_service
        self._repo = repository or PropertyRepository(db)

    def search(self, query: PropertySearchQuery) -> PropertySearchResult:
        self._validate_search_query(query)
        criteria = to_search_criteria(query)
        rows = self._repo.search(criteria, limit=query.limit, offset=query.offset)
        total_count = rows[0].total_count if rows else 0
        items = [
            map_search_property_card(
                property_id=row.id,
                title=row.title,
                slug=row.slug,
                property_type=row.property_type,
                district=row.district,
                nearest_station_name=row.nearest_station_name,
                monthly_price_min=row.monthly_price_min,
                tags=row.tags,
                cover_storage_path=row.cover_storage_path,
                cover_alt_text=row.cover_alt_text,
                latitude=row.latitude,
                longitude=row.longitude,
                distance_meters=row.distance_meters,
            )
            for row in rows
        ]
        return PropertySearchResult(items=items, total_count=total_count)

    def get_published_property(self, property_id: uuid.UUID) -> PropertyDetail:
        property_row = self._repo.get_published_property(property_id)
        if property_row is None or property_row.monthly_price_min is None:
            raise NotFoundError("Property not found")

        coordinates = self._repo.get_published_coordinates(property_id)
        amenities = self._repo.get_property_amenities(property_id)
        host_display_name = self._repo.get_host_display_name(property_row.host_id)

        return map_property_detail(
            property_row,
            host_display_name=host_display_name,
            latitude=coordinates.latitude if coordinates else None,
            longitude=coordinates.longitude if coordinates else None,
            amenities=amenities,
        )

    def create_property(self, user: AuthUser, request: HostPropertyRequest) -> CreatedId:
        host_id = self._require_host_id(user)
        slug = create_property_slug(request.title)
        fields = request_to_property_fields(request)
        fields["tags"] = normalize_tags(request.tags)

        property_row = self._repo.create_property(host_id=host_id, slug=slug, fields=fields)
        self._apply_location_if_present(property_row.id, request)
        self._repo.sync_amenities(property_row.id, request.amenity_ids)
        self._db.commit()
        return CreatedId(id=property_row.id)

    def update_property(
        self,
        user: AuthUser,
        property_id: uuid.UUID,
        request: HostPropertyRequest,
    ) -> HostPropertyDetail:
        self._require_mutable_property(user, property_id)
        fields = request_to_property_fields(request)
        fields["tags"] = normalize_tags(request.tags)

        updated = self._repo.update_property(property_id, fields)
        if updated is None:
            raise NotFoundError("Property not found")

        self._apply_location_if_present(property_id, request)
        self._repo.sync_amenities(property_id, request.amenity_ids)
        self._db.commit()
        return self._load_host_property_detail(property_id)

    def set_location(
        self,
        user: AuthUser,
        property_id: uuid.UUID,
        request: SetPropertyLocationRequest,
    ) -> None:
        self._require_mutable_property(user, property_id)
        if not self._repo.set_location(property_id, request.latitude, request.longitude):
            raise BadRequestError("Property location cannot be updated")
        self._db.commit()

    def submit_for_review(self, user: AuthUser, property_id: uuid.UUID) -> PropertyStatusChange:
        self._auth.require_host_of_property(user, property_id)
        property_row = self._repo.get_host_property(property_id)
        if property_row is None:
            raise NotFoundError("Property not found")

        if property_row.status != "draft":
            raise BadRequestError("Property must be in draft status to submit for review")

        if self._repo.count_available_rooms(property_id) == 0:
            raise BadRequestError("Add at least one available room before submitting")

        if not self._repo.has_location(property_id):
            raise BadRequestError("Geocode the property address before submitting")

        updated = self._repo.submit_for_review(property_id)
        if updated is None:
            raise BadRequestError("Property must be in draft status to submit for review")

        self._db.commit()
        return PropertyStatusChange(id=updated.id, status=PropertyStatus(updated.status))

    def _load_host_property_detail(self, property_id: uuid.UUID) -> HostPropertyDetail:
        property_row = self._repo.get_host_property(property_id)
        if property_row is None:
            raise NotFoundError("Property not found")

        coordinates = self._repo.get_coordinates(property_id)
        amenity_ids = self._repo.get_property_amenity_ids(property_id)
        return map_host_property_detail(
            property_row,
            latitude=coordinates.latitude if coordinates else None,
            longitude=coordinates.longitude if coordinates else None,
            amenity_ids=amenity_ids,
        )

    def _require_host_id(self, user: AuthUser) -> uuid.UUID:
        host_id = self._auth.get_host_id_for_profile(user.id)
        if host_id is None:
            raise ForbiddenError("Host profile is required before creating listings")
        return host_id

    def _require_mutable_property(self, user: AuthUser, property_id: uuid.UUID):
        property_row = self._repo.get_host_property(property_id)
        if property_row is None:
            raise NotFoundError("Property not found")

        if self._auth.is_admin(user.id):
            return property_row

        if not self._auth.is_host_of_property(user.id, property_id):
            raise ForbiddenError("Only the host of this property can perform this action")

        if property_row.status not in {"draft", "pending_review"}:
            raise BadRequestError("Property can only be updated while draft or pending review")

        return property_row

    def _apply_location_if_present(
        self,
        property_id: uuid.UUID,
        request: HostPropertyRequest,
    ) -> None:
        if request.latitude is None or request.longitude is None:
            return
        if not self._repo.set_location(property_id, request.latitude, request.longitude):
            raise BadRequestError("Property location cannot be updated")

    @staticmethod
    def _validate_search_query(query: PropertySearchQuery) -> None:
        if (
            query.price_min is not None
            and query.price_max is not None
            and query.price_max < query.price_min
        ):
            raise BadRequestError("priceMax must be greater than or equal to priceMin")

        if (
            query.check_in is not None
            and query.check_out is not None
            and query.check_out <= query.check_in
        ):
            raise BadRequestError("checkOut must be after checkIn")

