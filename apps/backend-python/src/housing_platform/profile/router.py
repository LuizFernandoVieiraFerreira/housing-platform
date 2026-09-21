from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import get_current_user
from housing_platform.auth.models import AuthUser
from housing_platform.db.session import get_db
from housing_platform.profile.schemas import Profile, UpdateProfileRequest
from housing_platform.profile.service import ProfileService

router = APIRouter(prefix="/profile", tags=["Profile"])


def get_profile_service(db: Session = Depends(get_db)) -> ProfileService:
    return ProfileService(db)


@router.get("", response_model=Profile)
def get_profile(
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: ProfileService = Depends(get_profile_service),
) -> Profile:
    return service.get_profile(user)


@router.patch("", response_model=Profile)
def update_profile(
    request: UpdateProfileRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: ProfileService = Depends(get_profile_service),
) -> Profile:
    return service.update_profile(user, request)
