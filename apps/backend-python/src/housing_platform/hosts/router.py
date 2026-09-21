from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import get_auth_service, get_current_user
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.session import get_db
from housing_platform.hosts.schemas import (
    Host,
    HostBooking,
    HostPropertyListItem,
    RegisterHostRequest,
)
from housing_platform.hosts.service import HostService
from housing_platform.properties.schemas import HostPropertyDetail

router = APIRouter(prefix="/hosts", tags=["Hosts"])


def get_host_service(
    db: Session = Depends(get_db),
    auth_service: AuthorizationService = Depends(get_auth_service),
) -> HostService:
    return HostService(db, auth_service)


@router.post("", response_model=Host, status_code=status.HTTP_201_CREATED)
def register_host(
    request: RegisterHostRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: HostService = Depends(get_host_service),
) -> Host:
    return service.register(user, request)


@router.get("/me", response_model=Host | None)
def get_current_host(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: HostService = Depends(get_host_service),
) -> Host | None:
    return service.get_current_host(user)


@router.get("/me/properties", response_model=list[HostPropertyListItem])
def list_host_properties(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: HostService = Depends(get_host_service),
) -> list[HostPropertyListItem]:
    return service.list_properties(user)


@router.get("/me/properties/{property_id}", response_model=HostPropertyDetail)
def get_host_property(
    property_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: HostService = Depends(get_host_service),
) -> HostPropertyDetail:
    return service.get_property(user, property_id)


@router.get("/me/bookings", response_model=list[HostBooking])
def list_host_bookings(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: HostService = Depends(get_host_service),
) -> list[HostBooking]:
    return service.list_bookings(user)
