from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserRole(StrEnum):
    CUSTOMER = "customer"
    HOST = "host"
    ADMIN = "admin"


class AuthUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    email: str | None
    role: UserRole

    @property
    def is_admin(self) -> bool:
        return self.role is UserRole.ADMIN
