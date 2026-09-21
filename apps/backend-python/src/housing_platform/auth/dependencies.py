from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from housing_platform.auth.errors import UnauthenticatedError
from housing_platform.auth.jwt_validator import SupabaseJwtValidator
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.config import settings
from housing_platform.db.session import get_db

_bearer_scheme = HTTPBearer(auto_error=False)
_jwt_validator = SupabaseJwtValidator(
    supabase_url=settings.supabase_url,
    jwt_secret=settings.supabase_jwt_secret,
    audience=settings.supabase_jwt_audience,
)


def get_jwt_validator() -> SupabaseJwtValidator:
    return _jwt_validator


def get_auth_service(db: Session = Depends(get_db)) -> AuthorizationService:
    return AuthorizationService(db)


def _extract_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> str | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    token = credentials.credentials.strip()
    return token or None


def get_current_user_optional(
    token: Annotated[str | None, Depends(_extract_bearer_token)],
    auth_service: Annotated[AuthorizationService, Depends(get_auth_service)],
    jwt_validator: Annotated[SupabaseJwtValidator, Depends(get_jwt_validator)],
) -> AuthUser | None:
    if token is None:
        return None

    claims = jwt_validator.validate(token)
    return auth_service.resolve_auth_user(claims.user_id, claims.email)


def get_current_user(
    user: Annotated[AuthUser | None, Depends(get_current_user_optional)],
) -> AuthUser:
    if user is None:
        raise UnauthenticatedError()
    return user


def require_admin(
    user: Annotated[AuthUser, Depends(get_current_user)],
    auth_service: Annotated[AuthorizationService, Depends(get_auth_service)],
) -> AuthUser:
    auth_service.require_admin(user)
    return user
