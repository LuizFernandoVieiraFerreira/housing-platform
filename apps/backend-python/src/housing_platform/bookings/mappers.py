import uuid
from datetime import date, datetime

from housing_platform.bookings.schemas import (
    Booking,
    BookingDetail,
    BookingListItem,
    BookingMode,
    BookingQuote,
    BookingStatus,
    BookingType,
)
from housing_platform.db.models import Bookings


def calculate_service_fee_percent(rent_krw: int, service_fee_krw: int) -> float:
    if rent_krw <= 0:
        return 0.0
    return round((service_fee_krw / rent_krw) * 100)


def map_booking_quote(
    *,
    room_id: uuid.UUID,
    property_id: uuid.UUID,
    booking_mode: str,
    nights: int,
    rent_krw: int,
    service_fee_krw: int,
    total_krw: int,
    pricing_version: str,
) -> BookingQuote:
    return BookingQuote(
        room_id=room_id,
        property_id=property_id,
        booking_mode=BookingMode(booking_mode),
        nights=nights,
        rent_krw=rent_krw,
        service_fee_krw=service_fee_krw,
        total_krw=total_krw,
        pricing_version=pricing_version,
    )


def map_booking(booking: Bookings) -> Booking:
    return Booking(
        id=booking.id,
        customer_id=booking.customer_id,
        room_id=booking.room_id,
        property_id=booking.property_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guest_count=booking.guest_count,
        status=BookingStatus(booking.status),
        booking_type=BookingType(booking.booking_type),
        hold_expires_at=booking.hold_expires_at,
        customer_notes=booking.customer_notes,
        approved_at=booking.approved_at,
        approved_by=booking.approved_by,
        cancelled_at=booking.cancelled_at,
        payment_retry_count=booking.payment_retry_count,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def map_booking_list_item(
    *,
    booking_id: uuid.UUID,
    status: str,
    booking_type: str,
    check_in: date,
    check_out: date,
    guest_count: int,
    property_title: str,
    district: str,
    room_name: str,
    total_krw: int,
    hold_expires_at: datetime | None,
    created_at: datetime,
) -> BookingListItem:
    return BookingListItem(
        id=booking_id,
        status=BookingStatus(status),
        booking_type=BookingType(booking_type),
        check_in=check_in,
        check_out=check_out,
        guest_count=guest_count,
        property_title=property_title,
        district=district,
        room_name=room_name,
        total_krw=total_krw,
        hold_expires_at=hold_expires_at,
        created_at=created_at,
    )


def map_booking_detail(
    list_item: BookingListItem,
    *,
    customer_notes: str | None,
    rent_krw: int,
    service_fee_krw: int,
    pricing_version: str,
    property_id: uuid.UUID,
    room_id: uuid.UUID,
) -> BookingDetail:
    return BookingDetail(
        **list_item.model_dump(),
        customer_notes=customer_notes,
        rent_krw=rent_krw,
        service_fee_krw=service_fee_krw,
        service_fee_percent=calculate_service_fee_percent(rent_krw, service_fee_krw),
        pricing_version=pricing_version,
        property_id=property_id,
        room_id=room_id,
    )
