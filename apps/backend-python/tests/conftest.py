from __future__ import annotations

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from housing_platform.auth.dependencies import get_current_user, get_db
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.main import create_app


@pytest.fixture
def customer() -> AuthUser:
    return AuthUser(id=uuid4(), email="customer@example.com", role=UserRole.CUSTOMER)


@pytest.fixture
def host() -> AuthUser:
    return AuthUser(id=uuid4(), email="host@example.com", role=UserRole.HOST)


@pytest.fixture
def admin() -> AuthUser:
    return AuthUser(id=uuid4(), email="admin@example.com", role=UserRole.ADMIN)


@contextmanager
def make_client(
    user: AuthUser | None = None,
    *,
    db_factory: Callable[[], Any] | None = None,
    overrides: dict[Any, Callable[[], Any]] | None = None,
) -> Iterator[TestClient]:
    app = create_app()
    if user is not None:
        app.dependency_overrides[get_current_user] = lambda: user
    if db_factory is not None:
        app.dependency_overrides[get_db] = db_factory
    if overrides:
        for dependency, factory in overrides.items():
            app.dependency_overrides[dependency] = factory

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def api_client() -> Iterator[TestClient]:
    with make_client() as client:
        yield client


@pytest.fixture
def authenticated_client(customer: AuthUser) -> Iterator[TestClient]:
    with make_client(customer) as client:
        yield client


def noop_rate_limit() -> MagicMock:
    return MagicMock(unsafe=True)
