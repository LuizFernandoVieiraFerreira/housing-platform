from housing_platform.config import Settings


def test_cors_origins_from_comma_separated_env() -> None:
    settings = Settings(cors_origins="http://localhost:5173,http://127.0.0.1:5173")
    assert settings.cors_origins == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_cors_origins_from_json_env() -> None:
    settings = Settings(cors_origins='["http://localhost:5173"]')
    assert settings.cors_origins == ["http://localhost:5173"]
