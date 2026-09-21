from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

HTTP_METHODS = frozenset({"get", "post", "put", "patch", "delete", "head", "options"})

REQUIRED_OPERATIONS: list[tuple[str, str]] = [
    ("/api/v1/properties", "get"),
    ("/api/v1/properties", "post"),
    ("/api/v1/properties/{id}", "get"),
    ("/api/v1/properties/{id}/submit-review", "post"),
    ("/api/v1/properties/{id}/location", "post"),
    ("/api/v1/bookings/quote", "get"),
    ("/api/v1/bookings", "get"),
    ("/api/v1/bookings", "post"),
    ("/api/v1/bookings/{id}/cancel", "post"),
    ("/api/v1/bookings/{id}/approve", "post"),
    ("/api/v1/bookings/{id}/reject", "post"),
    ("/api/v1/payments/orders", "post"),
    ("/api/v1/payments/confirm", "post"),
    ("/api/v1/payments/webhook", "post"),
    ("/api/v1/hosts", "post"),
    ("/api/v1/hosts/me", "get"),
    ("/api/v1/admin/stats", "get"),
    ("/api/v1/notifications", "get"),
    ("/api/v1/notifications/unread-count", "get"),
    ("/api/v1/profile", "get"),
    ("/api/v1/profile", "patch"),
]

CONTRACT_ERROR_CODES = frozenset(
    {
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "NOT_FOUND",
        "VALIDATION_ERROR",
        "BOOKING_CONFLICT",
        "BOOKING_EXPIRED",
        "PAYMENT_FAILED",
        "PAYMENT_AMOUNT_MISMATCH",
        "EXTERNAL_SERVICE_ERROR",
        "RATE_LIMITED",
        "INTERNAL_ERROR",
    }
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def canonical_openapi_path() -> Path:
    return repo_root() / "packages" / "api-contract" / "openapi.yaml"


def load_canonical_openapi() -> dict[str, Any]:
    with canonical_openapi_path().open(encoding="utf-8") as handle:
        document = yaml.safe_load(handle)
    if not isinstance(document, dict):
        msg = "Expected OpenAPI document to be a mapping"
        raise TypeError(msg)
    return document


def normalize_path(path: str) -> str:
    return re.sub(r"\{[^}]+\}", "{}", path)


def list_path_operations(document: dict[str, Any]) -> dict[tuple[str, str], str]:
    paths = document.get("paths")
    if not isinstance(paths, dict):
        return {}

    operations: dict[tuple[str, str], str] = {}
    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            operations[(normalize_path(path), method)] = path
    return operations


def assert_error_envelope(body: dict[str, Any]) -> None:
    assert "error" in body
    error = body["error"]
    assert isinstance(error, dict)
    assert set(error.keys()) <= {"code", "message", "details"}
    assert error["code"] in CONTRACT_ERROR_CODES
    assert isinstance(error["message"], str) and error["message"]
    assert isinstance(error.get("details", {}), dict)
