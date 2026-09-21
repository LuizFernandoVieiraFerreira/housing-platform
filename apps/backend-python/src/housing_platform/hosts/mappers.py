import uuid
from datetime import date, datetime

from housing_platform.bookings.schemas import BookingStatus, BookingType
from housing_platform.db.models import Hosts
from housing_platform.hosts.schemas import Host, HostBooking, HostPropertyListItem, HostStatus
from housing_platform.properties.schemas import AccommodationType, BookingMode, PropertyStatus


def map_host(host: Hosts) -> Host:
    return Host(
        id=host.id,
        profile_id=host.profile_id,
        display_name=host.display_name,
        status=HostStatus(host.status),
        verified_at=host.verified_at,
        created_at=host.created_at,
        updated_at=host.updated_at,
    )


def map_host_property_list_item(
    *,
    property_id: uuid.UUID,
    title: str,
    slug: str,
    property_type: str,
    district: str,
    status: str,
    booking_mode: str,
    monthly_price_min: int | None,
    room_count: int,
    updated_at: datetime,
) -> HostPropertyListItem:
    return HostPropertyListItem(
        id=property_id,
        title=title,
        slug=slug,
        property_type=AccommodationType(property_type),
        district=district,
        status=PropertyStatus(status),
        booking_mode=BookingMode(booking_mode),
        monthly_price_min=monthly_price_min,
        room_count=room_count,
        updated_at=updated_at,
    )


def map_host_booking(
    *,
    booking_id: uuid.UUID,
    status: str,
    booking_type: str,
    check_in: date,
    check_out: date,
    guest_count: int,
    customer_notes: str | None,
    property_title: str,
    room_name: str,
    total_krw: int,
    created_at: datetime,
) -> HostBooking:
    return HostBooking(
        id=booking_id,
        status=BookingStatus(status),
        booking_type=BookingType(booking_type),
        check_in=check_in,
        check_out=check_out,
        guest_count=guest_count,
        customer_notes=customer_notes,
        property_title=property_title,
        room_name=room_name,
        total_krw=total_krw,
        created_at=created_at,
    )
