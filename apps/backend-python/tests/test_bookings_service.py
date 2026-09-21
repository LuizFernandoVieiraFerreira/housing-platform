from datetime import UTC, date, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import ConflictError, ForbiddenError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.auth.service import AuthorizationService
from housing_platform.bookings.repository import BookingInputs, BookingListRow, BookingPrice
from housing_platform.bookings.schemas import BookingQuoteQuery, CreateBookingRequest
from housing_platform.bookings.service import BookingService
from housing_platform.db.models import Bookings


def _booking_row(*, status: str = "requested", booking_type: str = "request") -> Bookings:
    return Bookings(
        id=uuid4(),
        customer_id=uuid4(),
        room_id=uuid4(),
        property_id=uuid4(),
        check_in=date(2026, 10, 1),
        check_out=date(2026, 11, 1),
        guest_count=1,
        status=status,
        booking_type=booking_type,
        payment_retry_count=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _booking_inputs(*, booking_mode: str = "request") -> BookingInputs:
    return BookingInputs(
        room_id=uuid4(),
        property_id=uuid4(),
        booking_mode=booking_mode,
        min_stay_nights=30,
        monthly_price_krw=900_000,
        max_occupancy=2,
        nights=31,
    )


def _booking_price() -> BookingPrice:
    return BookingPrice(
        rent_krw=930_000,
        service_fee_krw=93_000,
        total_krw=1_023_000,
        pricing_version="v1",
    )


def _list_row(*, customer_id=None) -> BookingListRow:
    return BookingListRow(
        id=uuid4(),
        customer_id=customer_id or uuid4(),
        status="requested",
        booking_type="request",
        check_in=date(2026, 10, 1),
        check_out=date(2026, 11, 1),
        guest_count=1,
        hold_expires_at=None,
        created_at=datetime.now(UTC),
        customer_notes=None,
        property_id=uuid4(),
        room_id=uuid4(),
        property_title="Test Property",
        district="Mapo-gu",
        room_name="Room A",
        rent_krw=930_000,
        service_fee_krw=93_000,
        total_krw=1_023_000,
        pricing_version="v1",
    )


def test_quote_returns_price_breakdown() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    inputs = _booking_inputs()
    repo.validate_booking_inputs.return_value = inputs
    repo.calculate_booking_price.return_value = _booking_price()
    service = BookingService(db, AuthorizationService(db), repository=repo)

    result = service.quote(
        BookingQuoteQuery(
            roomId=inputs.room_id,
            checkIn=date(2026, 10, 1),
            checkOut=date(2026, 11, 1),
            guestCount=1,
        )
    )

    assert result.total_krw == 1_023_000
    assert result.nights == 31
    repo.assert_rate_limit.assert_called_once_with("quote:anon", 60, 60)


def test_create_booking_hold_commits_transaction() -> None:
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock(unsafe=True)
    inputs = _booking_inputs(booking_mode="request")
    created = _booking_row(status="requested", booking_type="request")
    repo.validate_booking_inputs.return_value = inputs
    repo.room_has_booking_conflict.return_value = False
    repo.calculate_booking_price.return_value = _booking_price()
    repo.create_booking_hold.return_value = created
    service = BookingService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="guest@example.com", role=UserRole.CUSTOMER)

    result = service.create_booking_hold(
        user,
        CreateBookingRequest(
            roomId=inputs.room_id,
            checkIn=date(2026, 10, 1),
            checkOut=date(2026, 11, 1),
            guestCount=1,
        ),
    )

    assert result.id == created.id
    repo.notify_booking_request.assert_called_once_with(created.id)
    db.commit.assert_called_once()


def test_create_booking_hold_rejects_conflicts() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    inputs = _booking_inputs()
    repo.validate_booking_inputs.return_value = inputs
    repo.room_has_booking_conflict.return_value = True
    service = BookingService(db, AuthorizationService(db), repository=repo)
    user = AuthUser(id=uuid4(), email="guest@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ConflictError, match="conflict"):
        service.create_booking_hold(
            user,
            CreateBookingRequest(
                roomId=inputs.room_id,
                checkIn=date(2026, 10, 1),
                checkOut=date(2026, 11, 1),
                guestCount=1,
            ),
        )


def test_cancel_booking_requires_owner() -> None:
    booking_id = uuid4()
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    booking = _booking_row(status="requested")
    repo.get_booking.return_value = booking
    service = BookingService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="other@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError, match="Cannot cancel"):
        service.cancel_booking(user, booking_id)


def test_cancel_booking_commits_on_success() -> None:
    booking_id = uuid4()
    db = MagicMock()
    auth = AuthorizationService(db)
    repo = MagicMock()
    booking = _booking_row(status="requested")
    cancelled = _booking_row(status="cancelled")
    repo.get_booking.return_value = booking
    repo.cancel_booking.return_value = cancelled
    service = BookingService(db, auth, repository=repo)
    user = AuthUser(id=booking.customer_id, email="guest@example.com", role=UserRole.CUSTOMER)

    result = service.cancel_booking(user, booking_id)

    assert result.status == "cancelled"
    db.commit.assert_called_once()


def test_approve_booking_requires_host() -> None:
    booking_id = uuid4()
    db = MagicMock()
    auth = MagicMock()
    auth.require_host_of_booking.side_effect = ForbiddenError(
        "Only the host of this booking can perform this action"
    )
    repo = MagicMock(unsafe=True)
    repo.get_booking.return_value = _booking_row()
    service = BookingService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="guest@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError):
        service.approve_booking(user, booking_id)


def test_get_booking_detail_denies_other_customers() -> None:
    booking_id = uuid4()
    db = MagicMock()
    auth = MagicMock()
    auth.is_admin.return_value = False
    auth.is_host_of_property.return_value = False
    row = _list_row()
    repo = MagicMock()
    repo.get_booking_detail_row.return_value = row
    service = BookingService(db, auth, repository=repo)
    user = AuthUser(id=uuid4(), email="other@example.com", role=UserRole.CUSTOMER)

    with pytest.raises(ForbiddenError):
        service.get_booking_detail(user, booking_id)


def test_list_my_bookings_maps_rows() -> None:
    db = MagicMock()
    repo = MagicMock()
    row = _list_row()
    repo.list_customer_bookings.return_value = [row]
    service = BookingService(db, AuthorizationService(db), repository=repo)
    user = AuthUser(id=row.customer_id, email="guest@example.com", role=UserRole.CUSTOMER)

    result = service.list_my_bookings(user)

    assert len(result) == 1
    assert result[0].property_title == "Test Property"
    assert result[0].total_krw == 1_023_000
