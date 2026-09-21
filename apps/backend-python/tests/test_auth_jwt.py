from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
import pytest

from housing_platform.auth.errors import UnauthenticatedError
from housing_platform.auth.jwt_validator import SupabaseJwtValidator

JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long"
SUPABASE_URL = "http://127.0.0.1:54321"
ISSUER = f"{SUPABASE_URL}/auth/v1"


def _build_token(
    *,
    user_id: UUID | None = None,
    role: str = "authenticated",
    audience: str = "authenticated",
    secret: str = JWT_SECRET,
    expired: bool = False,
) -> str:
    now = datetime.now(tz=UTC)
    payload = {
        "sub": str(user_id or uuid4()),
        "role": role,
        "aud": audience,
        "iss": ISSUER,
        "iat": now,
        "exp": now + (timedelta(seconds=-10) if expired else timedelta(hours=1)),
        "email": "test@example.com",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def validator() -> SupabaseJwtValidator:
    return SupabaseJwtValidator(
        supabase_url=SUPABASE_URL,
        jwt_secret=JWT_SECRET,
        audience="authenticated",
    )


def test_validate_accepts_authenticated_user_token(validator: SupabaseJwtValidator) -> None:
    user_id = uuid4()
    token = _build_token(user_id=user_id)

    claims = validator.validate(token)

    assert claims.user_id == user_id
    assert claims.email == "test@example.com"


def test_validate_rejects_expired_token(validator: SupabaseJwtValidator) -> None:
    token = _build_token(expired=True)

    with pytest.raises(UnauthenticatedError, match="Invalid or expired"):
        validator.validate(token)


def test_validate_rejects_service_role_token(validator: SupabaseJwtValidator) -> None:
    token = _build_token(role="service_role")

    with pytest.raises(UnauthenticatedError, match="not for an authenticated user"):
        validator.validate(token)


def test_validate_rejects_anon_token(validator: SupabaseJwtValidator) -> None:
    token = _build_token(role="anon")

    with pytest.raises(UnauthenticatedError, match="not for an authenticated user"):
        validator.validate(token)


def test_validate_requires_jwt_secret_for_hs256() -> None:
    validator = SupabaseJwtValidator(
        supabase_url=SUPABASE_URL,
        jwt_secret=None,
        audience="authenticated",
    )
    token = _build_token()

    with pytest.raises(UnauthenticatedError, match="Invalid or expired"):
        validator.validate(token)
