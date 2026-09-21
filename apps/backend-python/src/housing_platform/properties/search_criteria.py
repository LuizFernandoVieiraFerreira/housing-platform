import uuid
from dataclasses import dataclass
from datetime import date

from housing_platform.properties.schemas import PropertySearchQuery, PropertySearchSort


@dataclass(frozen=True)
class SearchPropertyRow:
    id: uuid.UUID
    title: str
    slug: str
    property_type: str
    district: str
    nearest_station_name: str | None
    monthly_price_min: int
    tags: list[str] | None
    cover_storage_path: str | None
    cover_alt_text: str | None
    latitude: float
    longitude: float
    distance_meters: float | None
    total_count: int


@dataclass(frozen=True)
class PropertySearchCriteria:
    text_query: str | None
    property_type: str | None
    price_min: int | None
    price_max: int | None
    guests: int | None
    stay_nights: int | None
    check_in: date | None
    sort: PropertySearchSort
    center_lat: float | None
    center_lng: float | None
    north: float | None
    south: float | None
    east: float | None
    west: float | None
    has_bounds: bool
    max_station_walk_min: int | None
    amenity_slugs: list[str] | None
    exclude_property_ids: list[uuid.UUID] | None


def to_search_criteria(query: PropertySearchQuery) -> PropertySearchCriteria:
    stay_nights = None
    if query.check_in is not None and query.check_out is not None:
        stay_nights = (query.check_out - query.check_in).days

    has_bounds = (
        query.north is not None
        and query.south is not None
        and query.east is not None
        and query.west is not None
    )

    text_query = query.query.strip() if query.query and query.query.strip() else None

    return PropertySearchCriteria(
        text_query=text_query,
        property_type=query.property_type.value if query.property_type is not None else None,
        price_min=query.price_min,
        price_max=query.price_max,
        guests=query.guests,
        stay_nights=stay_nights,
        check_in=query.check_in,
        sort=query.sort,
        center_lat=query.center_lat,
        center_lng=query.center_lng,
        north=query.north,
        south=query.south,
        east=query.east,
        west=query.west,
        has_bounds=has_bounds,
        max_station_walk_min=query.max_station_walk_min,
        amenity_slugs=query.amenity_slugs if query.amenity_slugs else None,
        exclude_property_ids=query.exclude_property_ids if query.exclude_property_ids else None,
    )
