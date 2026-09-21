from datetime import date
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AccommodationType(StrEnum):
    SHARE_HOUSE = "share-house"
    STUDIO = "studio"
    MICRO_STUDIO = "micro-studio"
    MULTI_BEDROOM = "multi-bedroom"


class PropertyStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BookingMode(StrEnum):
    INSTANT = "instant"
    REQUEST = "request"


class RoomStatus(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    ARCHIVED = "archived"


class PropertySearchSort(StrEnum):
    RECOMMENDED = "recommended"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    DISTANCE = "distance"
    SEMANTIC = "semantic"


class PropertySearchQuery(CamelModel):
    query: str | None = Field(default=None, max_length=120)
    property_type: AccommodationType | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: Annotated[int | None, Field(ge=1, le=20)] = None
    price_min: Annotated[int | None, Field(ge=0)] = None
    price_max: Annotated[int | None, Field(ge=0)] = None
    sort: PropertySearchSort = PropertySearchSort.RECOMMENDED
    center_lat: Annotated[float | None, Field(ge=-90, le=90)] = None
    center_lng: Annotated[float | None, Field(ge=-180, le=180)] = None
    north: Annotated[float | None, Field(ge=-90, le=90)] = None
    south: Annotated[float | None, Field(ge=-90, le=90)] = None
    east: Annotated[float | None, Field(ge=-180, le=180)] = None
    west: Annotated[float | None, Field(ge=-180, le=180)] = None
    amenity_slugs: list[str] | None = None
    max_station_walk_min: Annotated[int | None, Field(ge=1, le=120)] = None
    exclude_property_ids: list[UUID] | None = None
    limit: Annotated[int, Field(ge=1, le=100)] = 20
    offset: Annotated[int, Field(ge=0)] = 0


class SearchPropertyCard(CamelModel):
    id: UUID
    title: str
    slug: str
    property_type: AccommodationType
    district: str
    nearest_station_name: str | None
    monthly_price_min: int
    cover_image_url: str | None
    cover_image_alt: str | None
    tags: list[str]
    latitude: float
    longitude: float
    distance_meters: float | None


class PropertySearchResult(CamelModel):
    items: list[SearchPropertyCard]
    total_count: int


class PropertyImage(CamelModel):
    id: UUID
    storage_path: str
    url: str
    alt_text: str | None
    sort_order: int
    is_cover: bool


class PropertyRoom(CamelModel):
    id: UUID
    name: str
    room_type: str | None
    size_sqm: float | None
    max_occupancy: int
    monthly_price_krw: int
    status: RoomStatus
    available_from: date | None


class PropertyAmenity(CamelModel):
    id: UUID
    slug: str
    name: str
    icon: str | None


class PropertyDetail(CamelModel):
    id: UUID
    title: str
    slug: str
    description: str
    property_type: AccommodationType
    district: str
    nearest_station_name: str | None
    nearest_station_walk_min: int | None
    address_line1: str
    address_line2: str | None
    city: str
    booking_mode: BookingMode
    min_stay_nights: int
    monthly_price_min: int
    tags: list[str]
    host_display_name: str
    latitude: float | None
    longitude: float | None
    images: list[PropertyImage]
    rooms: list[PropertyRoom]
    amenities: list[PropertyAmenity]


class HostPropertyRequest(CamelModel):
    title: Annotated[str, Field(min_length=1, max_length=160)]
    description: Annotated[str, Field(min_length=20, max_length=5000)]
    property_type: AccommodationType
    address_line1: Annotated[str, Field(min_length=1, max_length=200)]
    address_line2: Annotated[str | None, Field(max_length=200)] = None
    city: Annotated[str, Field(min_length=1, max_length=80)]
    postal_code: Annotated[str | None, Field(max_length=20)] = None
    district: Annotated[str, Field(min_length=1, max_length=80)]
    nearest_station_name: Annotated[str | None, Field(max_length=120)] = None
    nearest_station_walk_min: Annotated[int | None, Field(ge=1, le=120)] = None
    booking_mode: BookingMode
    min_stay_nights: Annotated[int, Field(ge=1, le=365)]
    tags: Annotated[list[str], Field(max_length=20)] = Field(default_factory=list)
    amenity_ids: list[UUID] = Field(default_factory=list)
    latitude: Annotated[float | None, Field(ge=-90, le=90)] = None
    longitude: Annotated[float | None, Field(ge=-180, le=180)] = None


class SetPropertyLocationRequest(CamelModel):
    latitude: Annotated[float, Field(ge=-90, le=90)]
    longitude: Annotated[float, Field(ge=-180, le=180)]


class HostRoom(CamelModel):
    id: UUID
    name: str
    room_type: str | None
    size_sqm: float | None
    max_occupancy: int
    monthly_price_krw: int
    status: RoomStatus
    available_from: date | None


class HostPropertyDetail(CamelModel):
    id: UUID
    title: str
    slug: str
    description: str
    property_type: AccommodationType
    address_line1: str
    address_line2: str | None
    city: str
    postal_code: str | None
    district: str
    nearest_station_name: str | None
    nearest_station_walk_min: int | None
    status: PropertyStatus
    booking_mode: BookingMode
    min_stay_nights: int
    tags: list[str]
    latitude: float | None
    longitude: float | None
    amenity_ids: list[UUID]
    rooms: list[HostRoom]


class CreatedId(CamelModel):
    id: UUID


class PropertyStatusChange(CamelModel):
    id: UUID
    status: PropertyStatus
