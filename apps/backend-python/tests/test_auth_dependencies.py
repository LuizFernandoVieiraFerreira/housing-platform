from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from housing_platform.api.errors import register_exception_handlers
from housing_platform.auth.dependencies import get_current_user, get_current_user_optional
from housing_platform.auth.errors import UnauthenticatedError
from housing_platform.auth.jwt_validator import SupabaseJwtValidator
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.config import Settings

JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long"
SUPABASE_URL = "http://127.0.0.1:54321"


def _build_token(*, role: str = "authenticated") -> str:
    now = datetime.now(tz=UTC)
    payload = {
        "sub": str(uuid4()),
        "role": role,
        "aud": "authenticated",
        "iss": f"{SUPABASE_URL}/auth/v1",
        "iat": now,
        "exp": now + timedelta(hours=1),
        "email": "deps@example.com",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _create_test_app() -> FastAPI:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/protected")
    def protected(user: AuthUser = Depends(get_current_user)) -> dict[str, str]:
        return {"user_id": str(user.id), "role": user.role.value}

    @app.get("/optional")
    def optional(
        user: AuthUser | None = Depends(get_current_user_optional),
    ) -> dict[str, str | None]:
        return {"user_id": str(user.id) if user else None}

    return app


def test_get_current_user_returns_unauthenticated_error() -> None:
    client = TestClient(_create_test_app())

    response = client.get("/protected")

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHENTICATED",
            "message": "Authentication required",
            "details": {},
        }
    }


def test_get_current_user_optional_allows_anonymous_access() -> None:
    client = TestClient(_create_test_app())

    response = client.get("/optional")

    assert response.status_code == 200
    assert response.json() == {"user_id": None}


def test_get_current_user_rejects_invalid_token() -> None:
    client = TestClient(_create_test_app())

    response = client.get(
        "/protected",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_jwt_validator_and_settings_defaults() -> None:
    settings = Settings()
    validator = SupabaseJwtValidator(
        supabase_url=settings.supabase_url,
        jwt_secret=JWT_SECRET,
        audience=settings.supabase_jwt_audience,
    )
    token = _build_token()

    claims = validator.validate(token)

    assert claims.email == "deps@example.com"


def test_resolve_auth_user_missing_profile_surfaces_as_unauthenticated() -> None:
    validator = SupabaseJwtValidator(
        supabase_url=SUPABASE_URL,
        jwt_secret=JWT_SECRET,
    )
    token = _build_token()
    claims = validator.validate(token)

    db = type("Db", (), {"scalar": lambda *_args, **_kwargs: None})()
    service = AuthorizationService(db)  # type: ignore[arg-type]

    with pytest.raises(UnauthenticatedError):
        service.resolve_auth_user(claims.user_id, claims.email)
