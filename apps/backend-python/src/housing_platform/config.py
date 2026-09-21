import json
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres"
    api_prefix: str = "/api/v1"
    cors_origins: Annotated[list[str], NoDecode] = Field(default=["http://localhost:5173"])
    debug: bool = False
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_jwt_secret: str | None = None
    supabase_jwt_audience: str = "authenticated"
    toss_secret_key: str = ""
    payment_dev_mock: bool = False

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if not isinstance(value, str):
            msg = "CORS_ORIGINS must be a comma-separated list or JSON array"
            raise TypeError(msg)

        stripped = value.strip()
        if not stripped:
            return []

        if stripped.startswith("["):
            parsed = json.loads(stripped)
            if not isinstance(parsed, list):
                msg = "CORS_ORIGINS JSON value must be an array of strings"
                raise ValueError(msg)
            return [str(item).strip() for item in parsed if str(item).strip()]

        return [part.strip() for part in stripped.split(",") if part.strip()]


settings = Settings()
