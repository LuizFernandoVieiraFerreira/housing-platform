from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import Field

from housing_platform.auth.models import UserRole
from housing_platform.payments.schemas import CamelModel


class Profile(CamelModel):
    id: UUID
    role: UserRole
    full_name: str
    phone: str | None
    avatar_url: str | None
    preferred_language: str
    marketing_consent: bool
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(CamelModel):
    full_name: Annotated[str, Field(min_length=1, max_length=120)]
    phone: Annotated[str | None, Field(max_length=30)] = None
    preferred_language: Annotated[str, Field(min_length=2, max_length=10)]
    marketing_consent: bool
    avatar_url: str | None = None
