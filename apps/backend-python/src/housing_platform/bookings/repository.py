import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from housing_platform.auth.errors import BadRequestError, ConflictError, NotFoundError
from housing_platform.bookings.pricing import BookingPrice
from housing_platform.db.models import (
    BookingPriceSnapshots,
    Bookings,
    PlatformSettings,
    Properties,
    Rooms,
)


@dataclass(frozen=True)
class BookingInputs:
    room_id: uuid.UUID
    property_id: uuid.UUID
    booking_mode: str
    min_stay_nights: int
    monthly_price_krw: int
    max_occupancy: int
    nights: int


@dataclass(frozen=True)
class BookingListRow:
    id: uuid.UUID
    customer_id: uuid.UUID
    status: str
    booking_type: str
    check_in: date
    check_out: date
    guest_count: int
    hold_expires_at: datetime | None
    created_at: datetime
    customer_notes: str | None
    property_id: uuid.UUID
    room_id: uuid.UUID
    property_title: str
    district: str
    room_name: str
    rent_krw: int
    service_fee_krw: int
    total_krw: int
    pricing_version: str


class BookingRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def validate_booking_inputs(
        self,
        room_id: uuid.UUID,
        check_in: date,
        check_out: date,
        guest_count: int,
    ) -> BookingInputs:
        if check_out <= check_in:
            raise BadRequestError("checkOut must be after checkIn")

        if guest_count <= 0:
            raise BadRequestError("guestCount must be positive")

        room = self._db.scalar(
            select(Rooms).where(
                Rooms.id == room_id,
                Rooms.deleted_at.is_(None),
                Rooms.status == "available",
            )
        )
        if room is None:
            raise NotFoundError("Room is not available")

        property_row = self._db.scalar(
            select(Properties).where(
                Properties.id == room.property_id,
                Properties.deleted_at.is_(None),
                Properties.status == "published",
            )
        )
        if property_row is None:
            raise NotFoundError("Property is not published")

        nights = (check_out - check_in).days

        if nights < property_row.min_stay_nights:
            raise BadRequestError(
                f"Stay must be at least {property_row.min_stay_nights} nights"
            )

        if guest_count > room.max_occupancy:
            raise BadRequestError(f"Room supports up to {room.max_occupancy} guests")

        if room.available_from is not None and room.available_from > check_in:
            raise BadRequestError("Room is not available from the selected check-in date")

        return BookingInputs(
            room_id=room.id,
            property_id=property_row.id,
            booking_mode=property_row.booking_mode,
            min_stay_nights=property_row.min_stay_nights,
            monthly_price_krw=room.monthly_price_krw,
            max_occupancy=room.max_occupancy,
            nights=nights,
        )

    def room_has_booking_conflict(
        self,
        room_id: uuid.UUID,
        check_in: date,
        check_out: date,
    ) -> bool:
        return bool(
            self._db.scalar(
                text(
                    """
                    select exists (
                      select 1
                      from public.bookings b
                      where b.room_id = :room_id
                        and b.status in ('pending_payment', 'confirmed', 'active')
                        and daterange(b.check_in, b.check_out, '[)')
                            && daterange(:check_in, :check_out, '[)')
                    )
                    """
                ),
                {
                    "room_id": room_id,
                    "check_in": check_in,
                    "check_out": check_out,
                },
            )
        )

    def get_platform_settings(self) -> PlatformSettings:
        settings = self._db.scalar(select(PlatformSettings).where(PlatformSettings.id == 1))
        if settings is None:
            raise BadRequestError("Platform settings are not configured")
        return settings

    def create_booking_hold(
        self,
        *,
        customer_id: uuid.UUID,
        room_id: uuid.UUID,
        property_id: uuid.UUID,
        check_in: date,
        check_out: date,
        guest_count: int,
        customer_notes: str | None,
        booking_mode: str,
        price: BookingPrice,
        nights: int,
        monthly_price_krw: int,
    ) -> Bookings:
        settings = self.get_platform_settings()
        now = datetime.now(UTC)

        if booking_mode == "instant":
            status = "pending_payment"
            booking_type = "instant"
            hold_expires_at = now + timedelta(minutes=settings.hold_ttl_minutes)
        else:
            status = "requested"
            booking_type = "request"
            hold_expires_at = None

        booking = Bookings(
            customer_id=customer_id,
            room_id=room_id,
            property_id=property_id,
            check_in=check_in,
            check_out=check_out,
            guest_count=guest_count,
            status=status,
            booking_type=booking_type,
            hold_expires_at=hold_expires_at,
            customer_notes=customer_notes,
        )
        self._db.add(booking)

        try:
            self._db.flush()
        except IntegrityError as exc:
            if self._is_overlap_conflict(exc):
                raise ConflictError(
                    "Selected dates conflict with an existing booking hold"
                ) from exc
            raise

        snapshot = BookingPriceSnapshots(
            booking_id=booking.id,
            rent_krw=price.rent_krw,
            service_fee_krw=price.service_fee_krw,
            utilities_krw=0,
            total_krw=price.total_krw,
            pricing_version=price.pricing_version,
            nightly_breakdown=[
                {
                    "nights": nights,
                    "monthly_price_krw": monthly_price_krw,
                    "rent_krw": price.rent_krw,
                    "service_fee_krw": price.service_fee_krw,
                }
            ],
        )
        self._db.add(snapshot)

        try:
            self._db.flush()
        except IntegrityError as exc:
            if self._is_overlap_conflict(exc):
                raise ConflictError(
                    "Selected dates conflict with an existing booking hold"
                ) from exc
            raise

        return booking

    def list_customer_bookings(self, customer_id: uuid.UUID) -> list[BookingListRow]:
        rows = self._db.execute(
            text(
                """
                select
                  b.id,
                  b.customer_id,
                  b.status::text as status,
                  b.booking_type::text as booking_type,
                  b.check_in,
                  b.check_out,
                  b.guest_count,
                  b.hold_expires_at,
                  b.created_at,
                  b.customer_notes,
                  b.property_id,
                  b.room_id,
                  p.title as property_title,
                  p.district,
                  r.name as room_name,
                  s.rent_krw,
                  s.service_fee_krw,
                  s.total_krw,
                  s.pricing_version
                from public.bookings b
                join public.properties p on p.id = b.property_id
                join public.rooms r on r.id = b.room_id
                join public.booking_price_snapshots s on s.booking_id = b.id
                where b.customer_id = :customer_id
                order by b.created_at desc
                """
            ),
            {"customer_id": customer_id},
        ).mappings()

        return [
            BookingListRow(
                id=row["id"],
                customer_id=row["customer_id"],
                status=row["status"],
                booking_type=row["booking_type"],
                check_in=row["check_in"],
                check_out=row["check_out"],
                guest_count=row["guest_count"],
                hold_expires_at=row["hold_expires_at"],
                created_at=row["created_at"],
                customer_notes=row["customer_notes"],
                property_id=row["property_id"],
                room_id=row["room_id"],
                property_title=row["property_title"],
                district=row["district"],
                room_name=row["room_name"],
                rent_krw=row["rent_krw"],
                service_fee_krw=row["service_fee_krw"],
                total_krw=row["total_krw"],
                pricing_version=row["pricing_version"],
            )
            for row in rows
        ]

    def get_booking(self, booking_id: uuid.UUID) -> Bookings | None:
        return self._db.scalar(
            select(Bookings)
            .options(selectinload(Bookings.price_snapshot))
            .where(Bookings.id == booking_id)
        )

    def get_booking_detail_row(self, booking_id: uuid.UUID) -> BookingListRow | None:
        row = self._db.execute(
            text(
                """
                select
                  b.id,
                  b.customer_id,
                  b.status::text as status,
                  b.booking_type::text as booking_type,
                  b.check_in,
                  b.check_out,
                  b.guest_count,
                  b.hold_expires_at,
                  b.created_at,
                  b.customer_notes,
                  b.property_id,
                  b.room_id,
                  p.title as property_title,
                  p.district,
                  r.name as room_name,
                  s.rent_krw,
                  s.service_fee_krw,
                  s.total_krw,
                  s.pricing_version
                from public.bookings b
                join public.properties p on p.id = b.property_id
                join public.rooms r on r.id = b.room_id
                join public.booking_price_snapshots s on s.booking_id = b.id
                where b.id = :booking_id
                """
            ),
            {"booking_id": booking_id},
        ).mappings().first()

        if row is None:
            return None

        return BookingListRow(
            id=row["id"],
            customer_id=row["customer_id"],
            status=row["status"],
            booking_type=row["booking_type"],
            check_in=row["check_in"],
            check_out=row["check_out"],
            guest_count=row["guest_count"],
            hold_expires_at=row["hold_expires_at"],
            created_at=row["created_at"],
            customer_notes=row["customer_notes"],
            property_id=row["property_id"],
            room_id=row["room_id"],
            property_title=row["property_title"],
            district=row["district"],
            room_name=row["room_name"],
            rent_krw=row["rent_krw"],
            service_fee_krw=row["service_fee_krw"],
            total_krw=row["total_krw"],
            pricing_version=row["pricing_version"],
        )

    def cancel_booking(self, booking_id: uuid.UUID, customer_id: uuid.UUID) -> Bookings | None:
        booking = self._db.scalar(
            select(Bookings).where(
                Bookings.id == booking_id,
                Bookings.customer_id == customer_id,
                Bookings.status.in_(("requested", "pending_payment")),
            )
        )
        if booking is None:
            return None

        booking.status = "cancelled"
        booking.cancelled_at = datetime.now(UTC)
        self._db.flush()
        return booking

    def approve_booking(
        self,
        booking_id: uuid.UUID,
        approved_by: uuid.UUID,
    ) -> Bookings | None:
        booking = self.get_booking(booking_id)
        if booking is None or booking.status != "requested":
            return None

        if self.room_has_booking_conflict(booking.room_id, booking.check_in, booking.check_out):
            raise ConflictError("Selected dates conflict with an existing booking hold")

        settings = self.get_platform_settings()
        now = datetime.now(UTC)

        booking.status = "pending_payment"
        booking.hold_expires_at = now + timedelta(minutes=settings.hold_ttl_minutes)
        booking.approved_at = now
        booking.approved_by = approved_by

        try:
            self._db.flush()
        except IntegrityError as exc:
            if self._is_overlap_conflict(exc):
                raise ConflictError(
                    "Selected dates conflict with an existing booking hold"
                ) from exc
            raise

        return booking

    def reject_booking(self, booking_id: uuid.UUID) -> Bookings | None:
        booking = self._db.scalar(
            select(Bookings).where(
                Bookings.id == booking_id,
                Bookings.status == "requested",
            )
        )
        if booking is None:
            return None

        booking.status = "rejected"
        self._db.flush()
        return booking

    @staticmethod
    def _is_overlap_conflict(exc: IntegrityError) -> bool:
        message = str(exc.orig).lower()
        return "bookings_no_overlap" in message or "exclusion" in message
