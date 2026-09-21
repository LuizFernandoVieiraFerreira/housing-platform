import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from housing_platform.db.models import Profiles


class ProfileRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, profile_id: uuid.UUID) -> Profiles | None:
        return self._db.scalar(
            select(Profiles).where(
                Profiles.id == profile_id,
                Profiles.deleted_at.is_(None),
            )
        )

    def update(
        self,
        profile_id: uuid.UUID,
        *,
        full_name: str,
        phone: str | None,
        preferred_language: str,
        marketing_consent: bool,
        avatar_url: str | None,
    ) -> Profiles | None:
        profile = self.get_by_id(profile_id)
        if profile is None:
            return None

        profile.full_name = full_name.strip()
        profile.phone = phone.strip() if phone and phone.strip() else None
        profile.preferred_language = preferred_language.strip()
        profile.marketing_consent = marketing_consent
        profile.avatar_url = avatar_url.strip() if avatar_url and avatar_url.strip() else None

        self._db.flush()
        return profile
