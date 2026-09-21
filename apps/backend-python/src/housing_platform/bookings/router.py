from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import (
    get_auth_service,
    get_current_user,
    get_current_user_optional,
)
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.bookings.schemas import (
    Booking,
    BookingDetail,
    BookingListItem,
    BookingQuote,
    BookingQuoteQuery,
    CreateBookingRequest,
)
from housing_platform.bookings.service import BookingService
from housing_platform.db.session import get_db

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_booking_service(
    db: Session = Depends(get_db),
    auth_service: AuthorizationService = Depends(get_auth_service),
) -> BookingService:
    return BookingService(db, auth_service)


@router.get("/quote", response_model=BookingQuote)
def quote_booking(
    query: Annotated[BookingQuoteQuery, Depends()],
    user: Annotated[AuthUser | None, Depends(get_current_user_optional)],
    service: BookingService = Depends(get_booking_service),
) -> BookingQuote:
    rate_limit_actor = str(user.id) if user is not None else "anon"
    return service.quote(query, rate_limit_actor=rate_limit_actor)


@router.get("", response_model=list[BookingListItem])
def list_bookings(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> list[BookingListItem]:
    return service.list_my_bookings(user)


@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(
    request: CreateBookingRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> Booking:
    return service.create_booking_hold(user, request)


@router.get("/{booking_id}", response_model=BookingDetail)
def get_booking(
    booking_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> BookingDetail:
    return service.get_booking_detail(user, booking_id)


@router.post("/{booking_id}/cancel", response_model=Booking)
def cancel_booking(
    booking_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> Booking:
    return service.cancel_booking(user, booking_id)


@router.post("/{booking_id}/approve", response_model=Booking)
def approve_booking(
    booking_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> Booking:
    return service.approve_booking(user, booking_id)


@router.post("/{booking_id}/reject", response_model=Booking)
def reject_booking(
    booking_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: BookingService = Depends(get_booking_service),
) -> Booking:
    return service.reject_booking(user, booking_id)
