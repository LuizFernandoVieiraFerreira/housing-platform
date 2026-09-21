from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import get_auth_service, get_current_user
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.session import get_db
from housing_platform.properties.schemas import (
    CreatedId,
    HostPropertyDetail,
    HostPropertyRequest,
    PropertyDetail,
    PropertySearchQuery,
    PropertySearchResult,
    PropertyStatusChange,
    SetPropertyLocationRequest,
)
from housing_platform.properties.service import PropertyService

router = APIRouter(prefix="/properties", tags=["Properties"])


def get_property_service(
    db: Session = Depends(get_db),
    auth_service: AuthorizationService = Depends(get_auth_service),
) -> PropertyService:
    return PropertyService(db, auth_service)


@router.get("", response_model=PropertySearchResult)
def search_properties(
    query: Annotated[PropertySearchQuery, Depends()],
    service: PropertyService = Depends(get_property_service),
) -> PropertySearchResult:
    return service.search(query)


@router.get("/{property_id}", response_model=PropertyDetail)
def get_property(
    property_id: UUID,
    service: PropertyService = Depends(get_property_service),
) -> PropertyDetail:
    return service.get_published_property(property_id)


@router.post("", response_model=CreatedId, status_code=status.HTTP_201_CREATED)
def create_property(
    request: HostPropertyRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PropertyService = Depends(get_property_service),
) -> CreatedId:
    return service.create_property(user, request)


@router.patch("/{property_id}", response_model=HostPropertyDetail)
def update_property(
    property_id: UUID,
    request: HostPropertyRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PropertyService = Depends(get_property_service),
) -> HostPropertyDetail:
    return service.update_property(user, property_id, request)


@router.post("/{property_id}/submit-review", response_model=PropertyStatusChange)
def submit_property_for_review(
    property_id: UUID,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PropertyService = Depends(get_property_service),
) -> PropertyStatusChange:
    return service.submit_for_review(user, property_id)


@router.post("/{property_id}/location", status_code=status.HTTP_204_NO_CONTENT)
def set_property_location(
    property_id: UUID,
    request: SetPropertyLocationRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PropertyService = Depends(get_property_service),
) -> Response:
    service.set_location(user, property_id, request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
