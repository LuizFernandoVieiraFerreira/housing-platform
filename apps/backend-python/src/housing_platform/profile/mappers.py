from housing_platform.auth.models import UserRole
from housing_platform.db.models import Profiles
from housing_platform.profile.schemas import Profile


def map_profile(profile: Profiles) -> Profile:
    return Profile(
        id=profile.id,
        role=UserRole(profile.role),
        full_name=profile.full_name,
        phone=profile.phone,
        avatar_url=profile.avatar_url,
        preferred_language=profile.preferred_language,
        marketing_consent=profile.marketing_consent,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
