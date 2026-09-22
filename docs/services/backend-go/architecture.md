# Go backend architecture

chi + pgx + sqlc service with handler → service → repository layering and domain logic in Go services (not PostgreSQL RPCs).

## Package layout

```text
internal/
├── api/                   # Router, health check, error middleware
│   ├── errors/            # Standard error types and JSON envelope
│   └── health/            # Health check handler
├── auth/                  # JWT validation, AuthUser, authorization helpers
├── config/                # Environment-based configuration
├── db/                    # pgx pool, sqlc-generated queries and models
├── properties/            # Handler, service, repository
├── bookings/
├── payments/
├── hosts/
├── admin/
├── notifications/
└── profile/

db/
├── queries/               # Hand-written SQL files for sqlc
├── schema/                # Dumped schema for introspection (regenerated)
└── sqlc.yaml              # sqlc configuration
```

Each feature package typically contains:

```text
{feature}/
├── handler.go             # HTTP handlers (chi)
├── service.go             # Business logic, authorization
├── repository.go          # Data access (sqlc queries, raw SQL)
└── dto.go                 # Request/response types
```

## Request flow

```text
Handler  →  Service  →  Repository  →  sqlc / pgx
               ↓
            DTO
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Handler | `internal/{feature}/` | HTTP routing, request parsing, response encoding |
| Service | `internal/{feature}/` | Authorization checks, business logic, transactions |
| Repository | `internal/{feature}/` | Data access (sqlc-generated queries, raw SQL for PostGIS/pgvector) |
| Models | `internal/db/` | sqlc-generated types from PostgreSQL schema |
| DTO | `internal/{feature}/` | Request/response shapes (OpenAPI contract) |

Handlers stay thin. They parse requests, call services, and encode responses.

## Persistence conventions

- **Schema source of truth:** `supabase/migrations/`. No Go-owned migrations.
- **sqlc:** Generates type-safe query functions from hand-written SQL in `db/queries/`. Schema introspected from live database via `scripts/regenerate-schema.sh`.
- **pgx:** Connection pool managed in `internal/db/pool.go`. Services receive pool; repositories use sqlc-generated queries.
- **Domain logic in Go services**, not PostgreSQL RPCs. PostgreSQL functions in migrations remain for the Supabase/web client path.
- **PostGIS / pgvector:** Mapped as `any` in sqlc. Spatial queries use raw SQL via pgx.

## Authorization

REST connects with service credentials and **bypasses RLS**. Authorization is enforced in the service layer, mapped from [authorization-matrix.md](../../authorization-matrix.md).

| Component | Location | Role |
| --- | --- | --- |
| JWT validation | `internal/auth/` | Validate Supabase access tokens (JWKS or HS256) |
| Auth middleware | `internal/auth/` | Attach `AuthUser` to request context |
| Authorization helpers | `internal/auth/` | `IsAdmin`, `IsHost`, ownership checks |
| Service authorization | `internal/{feature}/service.go` | Enforce rules before data access |

## Error handling

Standard error types in `internal/api/errors/`:

```go
errors.BadRequest("invalid input")
errors.Forbidden("not authorized")
errors.NotFound("resource not found")
```

Error middleware converts panics and AppErrors to JSON responses:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot access this resource"
  }
}
```

## Testing

| Layer | Method |
| --- | --- |
| Services | `testing` package with mocked repositories |
| Handlers | `httptest` + `testing` |
| Repository | Integration tests with test database |
| Contract | Shared OpenAPI contract tests |
| Authorization | Dedicated authorization matrix tests |

Run with `make test` from `apps/backend-go`.

## Dependencies

| Purpose | Package |
| --- | --- |
| HTTP router | github.com/go-chi/chi/v5 |
| CORS | github.com/go-chi/cors |
| PostgreSQL driver | github.com/jackc/pgx/v5 |
| Query generation | sqlc (build-time) |
| JWT (planned) | github.com/golang-jwt/jwt/v5 or lestrrat-go/jwx |
