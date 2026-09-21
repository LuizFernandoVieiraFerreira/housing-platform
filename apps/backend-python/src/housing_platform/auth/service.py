from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from housing_platform.auth.errors import ForbiddenError, UnauthenticatedError
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.db.models import Bookings, Hosts, Profiles, Properties


class AuthorizationService:
    """Service-layer authorization helpers mirroring Supabase SQL functions."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def resolve_auth_user(self, user_id: UUID, email: str | None) -> AuthUser:
        profile = self._db.scalar(
            select(Profiles).where(
                Profiles.id == user_id,
                Profiles.deleted_at.is_(None),
            )
        )
        if profile is None:
            raise UnauthenticatedError("User profile not found")

        return AuthUser(
            id=profile.id,
            email=email,
            role=UserRole(profile.role),
        )

    def is_admin(self, user_id: UUID) -> bool:
        return self._db.scalar(
            select(
                exists().where(
                    Profiles.id == user_id,
                    Profiles.role == UserRole.ADMIN.value,
                    Profiles.deleted_at.is_(None),
                )
            )
        )

    def get_host_id_for_profile(self, user_id: UUID) -> UUID | None:
        return self._db.scalar(
            select(Hosts.id).where(
                Hosts.profile_id == user_id,
                Hosts.deleted_at.is_(None),
            )
        )

    def is_host_of_property(self, user_id: UUID, property_id: UUID) -> bool:
        host_property = (
            select(1)
            .select_from(Properties)
            .join(Hosts, Hosts.id == Properties.host_id)
            .where(
                Properties.id == property_id,
                Properties.deleted_at.is_(None),
                Hosts.profile_id == user_id,
                Hosts.deleted_at.is_(None),
            )
        )
        return self._db.scalar(select(exists(host_property)))

    def is_host_of_booking(self, user_id: UUID, booking_id: UUID) -> bool:
        property_id = self._db.scalar(select(Bookings.property_id).where(Bookings.id == booking_id))
        if property_id is None:
            return False
        return self.is_host_of_property(user_id, property_id)

    def require_admin(self, user: AuthUser) -> None:
        if not self.is_admin(user.id):
            raise ForbiddenError("Admin access required")

    def require_host_of_property(self, user: AuthUser, property_id: UUID) -> None:
        if not self.is_host_of_property(user.id, property_id):
            raise ForbiddenError("Only the host of this property can perform this action")

    def require_host_of_booking(self, user: AuthUser, booking_id: UUID) -> None:
        if not (self.is_admin(user.id) or self.is_host_of_booking(user.id, booking_id)):
            raise ForbiddenError("Only the host of this booking can perform this action")
