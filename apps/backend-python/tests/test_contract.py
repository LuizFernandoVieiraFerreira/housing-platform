from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from housing_platform.auth.models import AuthUser
from housing_platform.config import settings
from housing_platform.main import create_app
from tests.support.contract import (
    REQUIRED_OPERATIONS,
    assert_error_envelope,
    canonical_openapi_path,
    list_path_operations,
    load_canonical_openapi,
    normalize_path,
)


def _fastapi_operations() -> dict[tuple[str, str], str]:
    app = create_app()
    document = app.openapi()
    return list_path_operations(document)


def test_canonical_openapi_document_is_valid() -> None:
    document = load_canonical_openapi()

    assert document["openapi"] == "3.1.0"
    assert canonical_openapi_path().is_file()
    assert isinstance(document.get("paths"), dict)


@pytest.mark.parametrize(("path", "method"), REQUIRED_OPERATIONS)
def test_fastapi_exposes_required_contract_operation(path: str, method: str) -> None:
    operations = _fastapi_operations()
    normalized = normalize_path(path)

    assert (normalized, method) in operations, (
        f"Missing {method.upper()} {path} in FastAPI OpenAPI export"
    )


def test_fastapi_openapi_url_matches_api_prefix() -> None:
    client = TestClient(create_app())
    response = client.get(f"{settings.api_prefix}/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["openapi"].startswith("3.")
    assert isinstance(document.get("paths"), dict)


def test_fastapi_paths_are_defined_in_canonical_contract() -> None:
    canonical = list_path_operations(load_canonical_openapi())
    fastapi = _fastapi_operations()

    undefined: list[str] = []
    for (normalized_path, method), fastapi_path in fastapi.items():
        if normalized_path.endswith("/health"):
            continue
        if (normalized_path, method) not in canonical:
            undefined.append(f"{method.upper()} {fastapi_path}")

    assert not undefined, (
        "FastAPI exposes routes that are not in the canonical contract:\n"
        + "\n".join(undefined)
    )


def test_unauthenticated_error_matches_contract_envelope() -> None:
    client = TestClient(create_app())
    response = client.get(f"{settings.api_prefix}/bookings")

    assert response.status_code == 401
    body: dict[str, Any] = response.json()
    assert_error_envelope(body)
    assert body["error"]["code"] == "UNAUTHENTICATED"


def test_validation_error_matches_contract_envelope(customer: AuthUser) -> None:
    from housing_platform.auth.dependencies import get_current_user

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: customer

    with TestClient(app) as client:
        response = client.post(f"{settings.api_prefix}/payments/orders", json={})

    assert response.status_code == 400
    body: dict[str, Any] = response.json()
    assert_error_envelope(body)
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "issues" in body["error"]["details"]
