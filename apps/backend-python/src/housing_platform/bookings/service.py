import uuid

from sqlalchemy.orm import Session

from housing_platform.auth.errors import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.bookings.mappers import (
    map_booking,
    map_booking_detail,
    map_booking_list_item,
    map_booking_quote,
)
from housing_platform.bookings.repository import BookingListRow, BookingRepository
from housing_platform.bookings.schemas import (
    Booking,
    BookingDetail,
    BookingListItem,
    BookingQuote,
    BookingQuoteQuery,
    CreateBookingRequest,
)


class BookingService:
    def __init__(
        self,
        db: Session,
        auth_service: AuthorizationService,
        repository: BookingRepository | None = None,
    ) -> None:
        self._db = db
        self._auth = auth_service
        self._repo = repository or BookingRepository(db)

    def quote(
        self,
        query: BookingQuoteQuery,
        *,
        rate_limit_actor: str = "anon",
    ) -> BookingQuote:
        self._repo.assert_rate_limit(f"quote:{rate_limit_actor}", 60, 60)
        inputs = self._repo.validate_booking_inputs(
            query.room_id,
            query.check_in,
            query.check_out,
            query.guest_count,
        )
        price = self._repo.calculate_booking_price(inputs.monthly_price_krw, inputs.nights)
        return map_booking_quote(
            room_id=inputs.room_id,
            property_id=inputs.property_id,
            booking_mode=inputs.booking_mode,
            nights=inputs.nights,
            rent_krw=price.rent_krw,
            service_fee_krw=price.service_fee_krw,
            total_krw=price.total_krw,
            pricing_version=price.pricing_version,
        )

    def list_my_bookings(self, user: AuthUser) -> list[BookingListItem]:
        rows = self._repo.list_customer_bookings(user.id)
        return [self._map_list_row(row) for row in rows]

    def get_booking_detail(self, user: AuthUser, booking_id: uuid.UUID) -> BookingDetail:
        row = self._repo.get_booking_detail_row(booking_id)
        if row is None:
            raise NotFoundError("Booking not found")

        self._require_booking_access(user, row.property_id, customer_id=row.customer_id)
        return self._map_detail_row(row)

    def create_booking_hold(self, user: AuthUser, request: CreateBookingRequest) -> Booking:
        self._repo.assert_rate_limit(f"booking_hold:{user.id}", 10, 60)

        inputs = self._repo.validate_booking_inputs(
            request.room_id,
            request.check_in,
            request.check_out,
            request.guest_count,
        )

        if self._repo.room_has_booking_conflict(
            request.room_id,
            request.check_in,
            request.check_out,
        ):
            raise ConflictError("Selected dates conflict with an existing booking hold")

        price = self._repo.calculate_booking_price(inputs.monthly_price_krw, inputs.nights)
        customer_notes = request.customer_notes.strip() if request.customer_notes else None
        if customer_notes == "":
            customer_notes = None

        booking = self._repo.create_booking_hold(
            customer_id=user.id,
            room_id=inputs.room_id,
            property_id=inputs.property_id,
            check_in=request.check_in,
            check_out=request.check_out,
            guest_count=request.guest_count,
            customer_notes=customer_notes,
            booking_mode=inputs.booking_mode,
            price=price,
            nights=inputs.nights,
            monthly_price_krw=inputs.monthly_price_krw,
        )

        if inputs.booking_mode == "request":
            self._repo.notify_booking_request(booking.id)

        self._db.commit()
        self._db.refresh(booking)
        return map_booking(booking)

    def cancel_booking(self, user: AuthUser, booking_id: uuid.UUID) -> Booking:
        booking = self._repo.get_booking(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")

        if booking.customer_id != user.id:
            raise ForbiddenError("Cannot cancel this booking")

        cancelled = self._repo.cancel_booking(booking_id, user.id)
        if cancelled is None:
            raise BadRequestError("Booking cannot be cancelled")

        self._db.commit()
        self._db.refresh(cancelled)
        return map_booking(cancelled)

    def approve_booking(self, user: AuthUser, booking_id: uuid.UUID) -> Booking:
        booking = self._repo.get_booking(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")

        self._auth.require_host_of_booking(user, booking_id)

        approved = self._repo.approve_booking(booking_id, user.id)
        if approved is None:
            raise BadRequestError("Booking must be in requested status to approve")

        self._repo.notify_booking_confirmed(booking_id)
        self._db.commit()
        self._db.refresh(approved)
        return map_booking(approved)

    def reject_booking(self, user: AuthUser, booking_id: uuid.UUID) -> Booking:
        booking = self._repo.get_booking(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")

        self._auth.require_host_of_booking(user, booking_id)

        rejected = self._repo.reject_booking(booking_id)
        if rejected is None:
            raise BadRequestError("Booking must be in requested status to reject")

        self._repo.notify_booking_rejected(booking_id)
        self._db.commit()
        self._db.refresh(rejected)
        return map_booking(rejected)

    def _require_booking_access(
        self,
        user: AuthUser,
        property_id: uuid.UUID,
        *,
        customer_id: uuid.UUID,
    ) -> None:
        if customer_id == user.id:
            return
        if self._auth.is_admin(user.id):
            return
        if self._auth.is_host_of_property(user.id, property_id):
            return
        raise ForbiddenError("Booking not found")

    @staticmethod
    def _map_list_row(row: BookingListRow) -> BookingListItem:
        return map_booking_list_item(
            booking_id=row.id,
            status=row.status,
            booking_type=row.booking_type,
            check_in=row.check_in,
            check_out=row.check_out,
            guest_count=row.guest_count,
            property_title=row.property_title,
            district=row.district,
            room_name=row.room_name,
            total_krw=row.total_krw,
            hold_expires_at=row.hold_expires_at,
            created_at=row.created_at,
        )

    @staticmethod
    def _map_detail_row(row: BookingListRow) -> BookingDetail:
        list_item = BookingService._map_list_row(row)
        return map_booking_detail(
            list_item,
            customer_notes=row.customer_notes,
            rent_krw=row.rent_krw,
            service_fee_krw=row.service_fee_krw,
            pricing_version=row.pricing_version,
            property_id=row.property_id,
            room_id=row.room_id,
        )
