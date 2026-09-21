import re
import uuid

from housing_platform.config import settings
from housing_platform.db.models import Amenities, Properties, PropertyImages, Rooms
from housing_platform.properties.schemas import (
    AccommodationType,
    BookingMode,
    HostPropertyDetail,
    HostRoom,
    PropertyAmenity,
    PropertyDetail,
    PropertyImage,
    PropertyRoom,
    PropertyStatus,
    RoomStatus,
    SearchPropertyCard,
)

PROPERTY_IMAGES_BUCKET = "property-images"


def create_property_slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{base or 'listing'}-{uuid.uuid4().hex[:8]}"


def resolve_property_image_url(storage_path: str) -> str:
    if storage_path.startswith(("http://", "https://")):
        return storage_path
    base = settings.supabase_url.rstrip("/")
    path = storage_path.lstrip("/")
    return f"{base}/storage/v1/object/public/{PROPERTY_IMAGES_BUCKET}/{path}"


def map_search_property_card(
    *,
    property_id: uuid.UUID,
    title: str,
    slug: str,
    property_type: str,
    district: str,
    nearest_station_name: str | None,
    monthly_price_min: int,
    tags: list[str] | None,
    cover_storage_path: str | None,
    cover_alt_text: str | None,
    latitude: float,
    longitude: float,
    distance_meters: float | None,
) -> SearchPropertyCard:
    return SearchPropertyCard(
        id=property_id,
        title=title,
        slug=slug,
        property_type=AccommodationType(property_type),
        district=district,
        nearest_station_name=nearest_station_name,
        monthly_price_min=monthly_price_min,
        cover_image_url=(
            resolve_property_image_url(cover_storage_path) if cover_storage_path else None
        ),
        cover_image_alt=cover_alt_text,
        tags=tags or [],
        latitude=latitude,
        longitude=longitude,
        distance_meters=distance_meters,
    )


def _map_property_images(images: list[PropertyImages]) -> list[PropertyImage]:
    sorted_images = sorted(
        images,
        key=lambda image: (not image.is_cover, image.sort_order),
    )
    return [
        PropertyImage(
            id=image.id,
            storage_path=image.storage_path,
            url=resolve_property_image_url(image.storage_path),
            alt_text=image.alt_text,
            sort_order=image.sort_order,
            is_cover=image.is_cover,
        )
        for image in sorted_images
    ]


def _map_property_rooms(rooms: list[Rooms]) -> list[PropertyRoom]:
    available_rooms = [
        room for room in rooms if room.deleted_at is None and room.status == "available"
    ]
    sorted_rooms = sorted(available_rooms, key=lambda room: room.monthly_price_krw)
    return [
        PropertyRoom(
            id=room.id,
            name=room.name,
            room_type=room.room_type,
            size_sqm=float(room.size_sqm) if room.size_sqm is not None else None,
            max_occupancy=room.max_occupancy,
            monthly_price_krw=room.monthly_price_krw,
            status=RoomStatus(room.status),
            available_from=room.available_from,
        )
        for room in sorted_rooms
    ]


def _map_property_amenities(amenities: list[Amenities]) -> list[PropertyAmenity]:
    sorted_amenities = sorted(amenities, key=lambda amenity: amenity.sort_order)
    return [
        PropertyAmenity(
            id=amenity.id,
            slug=amenity.slug,
            name=amenity.name,
            icon=amenity.icon,
        )
        for amenity in sorted_amenities
    ]


def map_property_detail(
    property_row: Properties,
    *,
    host_display_name: str,
    latitude: float | None,
    longitude: float | None,
    amenities: list[Amenities],
) -> PropertyDetail:
    return PropertyDetail(
        id=property_row.id,
        title=property_row.title,
        slug=property_row.slug,
        description=property_row.description,
        property_type=AccommodationType(property_row.property_type),
        district=property_row.district,
        nearest_station_name=property_row.nearest_station_name,
        nearest_station_walk_min=property_row.nearest_station_walk_min,
        address_line1=property_row.address_line1,
        address_line2=property_row.address_line2,
        city=property_row.city,
        booking_mode=BookingMode(property_row.booking_mode),
        min_stay_nights=property_row.min_stay_nights,
        monthly_price_min=property_row.monthly_price_min or 0,
        tags=property_row.tags or [],
        host_display_name=host_display_name,
        latitude=latitude,
        longitude=longitude,
        images=_map_property_images(property_row.property_images),
        rooms=_map_property_rooms(property_row.rooms),
        amenities=_map_property_amenities(amenities),
    )


def _map_host_rooms(rooms: list[Rooms]) -> list[HostRoom]:
    active_rooms = [room for room in rooms if room.deleted_at is None]
    return [
        HostRoom(
            id=room.id,
            name=room.name,
            room_type=room.room_type,
            size_sqm=float(room.size_sqm) if room.size_sqm is not None else None,
            max_occupancy=room.max_occupancy,
            monthly_price_krw=room.monthly_price_krw,
            status=RoomStatus(room.status),
            available_from=room.available_from,
        )
        for room in active_rooms
    ]


def map_host_property_detail(
    property_row: Properties,
    *,
    latitude: float | None,
    longitude: float | None,
    amenity_ids: list[uuid.UUID],
) -> HostPropertyDetail:
    return HostPropertyDetail(
        id=property_row.id,
        title=property_row.title,
        slug=property_row.slug,
        description=property_row.description,
        property_type=AccommodationType(property_row.property_type),
        address_line1=property_row.address_line1,
        address_line2=property_row.address_line2,
        city=property_row.city,
        postal_code=property_row.postal_code,
        district=property_row.district,
        nearest_station_name=property_row.nearest_station_name,
        nearest_station_walk_min=property_row.nearest_station_walk_min,
        status=PropertyStatus(property_row.status),
        booking_mode=BookingMode(property_row.booking_mode),
        min_stay_nights=property_row.min_stay_nights,
        tags=property_row.tags or [],
        latitude=latitude,
        longitude=longitude,
        amenity_ids=amenity_ids,
        rooms=_map_host_rooms(property_row.rooms),
    )


def request_to_property_fields(request) -> dict:
    return {
        "title": request.title,
        "description": request.description,
        "property_type": request.property_type.value,
        "address_line1": request.address_line1,
        "address_line2": request.address_line2,
        "city": request.city,
        "postal_code": request.postal_code,
        "district": request.district,
        "nearest_station_name": request.nearest_station_name,
        "nearest_station_walk_min": request.nearest_station_walk_min,
        "booking_mode": request.booking_mode.value,
        "min_stay_nights": request.min_stay_nights,
        "tags": request.tags[:20],
    }


def normalize_tags(tags: list[str]) -> list[str]:
    return [tag.strip() for tag in tags if tag.strip()][:20]
