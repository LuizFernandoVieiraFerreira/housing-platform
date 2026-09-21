from dataclasses import dataclass
from uuid import UUID

import jwt
from jwt import PyJWKClient

from housing_platform.auth.errors import UnauthenticatedError


@dataclass(frozen=True)
class JwtClaims:
    user_id: UUID
    email: str | None


class SupabaseJwtValidator:
    """Validate Supabase Auth access tokens via JWKS or HS256 secret."""

    def __init__(
        self,
        *,
        supabase_url: str,
        jwt_secret: str | None,
        audience: str = "authenticated",
    ) -> None:
        self._audience = audience
        self._jwt_secret = jwt_secret.strip() if jwt_secret else None
        self._issuer = f"{supabase_url.rstrip('/')}/auth/v1"
        self._jwks_client = PyJWKClient(
            f"{self._issuer}/.well-known/jwks.json",
            cache_keys=True,
        )

    def validate(self, token: str) -> JwtClaims:
        try:
            payload = self._decode(token)
        except jwt.PyJWTError as exc:
            raise UnauthenticatedError("Invalid or expired access token") from exc

        role = payload.get("role")
        if role != "authenticated":
            raise UnauthenticatedError("Access token is not for an authenticated user")

        try:
            user_id = UUID(str(payload["sub"]))
        except (KeyError, TypeError, ValueError) as exc:
            raise UnauthenticatedError("Access token is missing a valid subject") from exc

        email = payload.get("email")
        return JwtClaims(user_id=user_id, email=str(email) if email else None)

    def _decode(self, token: str) -> dict[str, object]:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")

        if algorithm == "HS256":
            if not self._jwt_secret:
                msg = "HS256 token requires SUPABASE_JWT_SECRET"
                raise jwt.InvalidTokenError(msg)
            return jwt.decode(
                token,
                self._jwt_secret,
                algorithms=["HS256"],
                audience=self._audience,
                issuer=self._issuer,
                options={"require": ["exp", "sub"]},
            )

        if not isinstance(algorithm, str):
            msg = "Token header is missing a supported algorithm"
            raise jwt.InvalidTokenError(msg)

        signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience=self._audience,
            options={"require": ["exp", "sub"]},
        )
