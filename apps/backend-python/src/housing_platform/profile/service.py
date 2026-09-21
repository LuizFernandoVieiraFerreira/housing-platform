from sqlalchemy.orm import Session

from housing_platform.auth.errors import NotFoundError
from housing_platform.auth.models import AuthUser
from housing_platform.profile.mappers import map_profile
from housing_platform.profile.repository import ProfileRepository
from housing_platform.profile.schemas import Profile, UpdateProfileRequest


class ProfileService:
    def __init__(
        self,
        db: Session,
        repository: ProfileRepository | None = None,
    ) -> None:
        self._db = db
        self._repo = repository or ProfileRepository(db)

    def get_profile(self, user: AuthUser) -> Profile:
        profile = self._repo.get_by_id(user.id)
        if profile is None:
            raise NotFoundError("Profile not found")
        return map_profile(profile)

    def update_profile(self, user: AuthUser, request: UpdateProfileRequest) -> Profile:
        updated = self._repo.update(
            user.id,
            full_name=request.full_name,
            phone=request.phone,
            preferred_language=request.preferred_language,
            marketing_consent=request.marketing_consent,
            avatar_url=request.avatar_url,
        )
        if updated is None:
            raise NotFoundError("Profile not found")

        self._db.commit()
        self._db.refresh(updated)
        return map_profile(updated)
