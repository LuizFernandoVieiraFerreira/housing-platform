# Python backend architecture

FastAPI service with feature-based packages, a shared SQLAlchemy model layer, and domain logic in Python services (not PostgreSQL RPCs).

## Package layout

```text
housing_platform/
├── admin/                 # Admin dashboards, reviews, audit logs
├── bookings/
├── hosts/
├── notifications/
├── payments/
├── profile/
├── properties/
├── auth/                  # JWT validation, AuthorizationService, AppError types
├── shared/                # Cross-cutting utilities (rate limiting)
├── api/                   # Router aggregation, health, global exception handlers
├── config.py              # Pydantic settings
├── db/                    # Engine, session, generated ORM models
└── main.py                # FastAPI app factory
```

Each feature package typically contains:

```text
{feature}/
├── router.py              # FastAPI routes
├── service.py             # Business rules, authorization, orchestration
├── repository.py          # SQLAlchemy queries and inline SQL
├── schemas.py             # Pydantic request/response models (OpenAPI shapes)
└── mappers.py             # Row/entity → schema mapping
```

Some features add focused modules for non-trivial domain logic:

```text
bookings/pricing.py        # Booking price calculation
bookings/notifications.py  # Booking notification inserts
payments/finalization.py   # Payment confirm / fail / webhook events
properties/search_criteria.py
properties/search_query.py # PostGIS native search SQL
```

## Request flow

```text
Router  →  Service  →  Repository  →  db.models / SQL
              ↓
          Schema / Mapper
```

| Layer      | Location                  | Responsibility                                    |
| ---------- | ------------------------- | ------------------------------------------------- |
| Router     | `{feature}/router.py`     | HTTP routing, dependency injection, input binding |
| Service    | `{feature}/service.py`    | Authorization checks, orchestration, transactions |
| Repository | `{feature}/repository.py` | Data access (ORM, raw SQL)                        |
| Model      | `db/models.py`            | SQLAlchemy mapping of shared PostgreSQL schema    |
| Schema     | `{feature}/schemas.py`    | API request/response validation and serialization |
| Mapper     | `{feature}/mappers.py`    | Repository rows / ORM entities → schemas          |

Routers stay thin. They resolve dependencies (`get_db`, `get_current_user`, feature services) and delegate to services.

## Persistence conventions

- **Schema source of truth:** `supabase/migrations/`. No Alembic, no `MetaData.create_all()`.
- **ORM models:** Generated with sqlacodegen into `db/models.py` (via `scripts/regenerate-models.sh` + post-processing). Treat generated output as read-only except for documented manual fixes (geography, vector, `create_type=False` on enums).
- **Session:** One SQLAlchemy `Session` per request via `get_db()` in `db/session.py`. Services receive the session; repositories are constructed with it.
- **Domain logic in Python services**, not PostgreSQL RPCs. PostgreSQL functions in migrations remain for the Supabase/web client path.
- **Use ORM / inline SQL** for CRUD and list queries; native SQL only when ORM is awkward (PostGIS search, date-range overlap checks).
- **PostGIS / pgvector:** Mapped in models (GeoAlchemy2, pgvector). Spatial reads stay in repository SQL when needed.

## Authorization

REST connects with service credentials and **bypasses RLS**. Authorization is enforced in the service layer, mapped from [authorization-matrix.md](../../authorization-matrix.md).

| Component             | Location                | Role                                                             |
| --------------------- | ----------------------- | ---------------------------------------------------------------- |
| JWT validation        | `auth/jwt_validator.py` | Validate Supabase access tokens (JWKS or HS256)                  |
| Auth dependencies     | `auth/dependencies.py`  | `get_current_user`, `get_current_user_optional`, `require_admin` |
| Authorization helpers | `auth/service.py`       | `is_admin`, `is_host_of_property`, `is_host_of_booking`, etc.    |
| App errors            | `auth/errors.py`        | `AppError` subclasses with OpenAPI-aligned codes                 |
| Error envelope        | `api/errors.py`         | Maps exceptions to `{ error: { code, message, details } }`       |

Services call `AuthorizationService` before reads and writes. Hide rows the caller must not see (`NotFoundError`) rather than returning forbidden when that matches the authorization matrix.

## Dependency rules

- Features may import `auth/`, `shared/`, `db/`, `config`, and **`schemas` / `mappers` from other features** when response shapes or enums are shared (e.g. admin listing host bookings).
- Features must **not** import another feature's **service or repository** except where one feature clearly orchestrates another domain (e.g. `hosts` using `PropertyRepository` for host property detail).
- Cross-entity workflows that span tables belong in the **owning feature's service** (payments finalizing a booking, bookings sending notifications via `BookingNotificationService`).
- External HTTP (Toss Payments) lives in feature-specific clients (`payments/toss_client.py`), not in repositories.

## Business logic placement

Domain rules belong in **services**, not in SQL functions or repository classes:

| Concern                            | Where it lives                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Rate limiting                      | `shared/rate_limit.py`                                                         |
| Booking quote / hold / approve     | `bookings/service.py` + `bookings/pricing.py`, `bookings/notifications.py`     |
| Property search                    | `properties/service.py` → native SQL in `properties/search_query.py`           |
| Payment orders / confirm / webhook | `payments/service.py` + `payments/finalization.py` + Toss client                 |
| Host registration                  | `hosts/service.py` + trigger bypass in `hosts/repository.py`                   |
| Admin publish / reject / approve   | `admin/service.py` + audit log writes                                          |
| Profile updates                    | `profile/service.py` (no `role` in update schema)                              |

## Testing

| Suite          | Location                                         | Purpose                                                                  |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Unit / service | `tests/test_*_service.py`                        | Service logic with mocked repositories and domain services               |
| Auth           | `tests/test_auth_*.py`                           | JWT validation, dependencies, authorization helpers                      |
| Contract       | `tests/test_contract.py`                         | FastAPI OpenAPI export vs canonical `packages/api-contract/openapi.yaml` |
| Authorization  | `tests/test_authorization.py`                    | Fail-closed HTTP checks per authorization matrix                         |
| Shared helpers | `tests/conftest.py`, `tests/support/contract.py` | Test client, JWT fixtures, contract parsing                              |

Run with `poetry run pytest` from `apps/backend-python`.
