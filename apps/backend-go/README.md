# Housing Platform — Go Backend

chi + pgx + sqlc backend that reflects the shared Supabase PostgreSQL schema.

**Architecture:** Handler → Service → Repository pattern under `internal/`. See [`docs/services/backend-go/architecture.md`](../../docs/services/backend-go/architecture.md).

**Schema ownership:** Supabase SQL migrations in `supabase/migrations/` are the only DDL source. This app does not own migrations. sqlc generates types by introspecting the migrated database.

## Prerequisites

- Go 1.23+
- Local Supabase (`pnpm db:reset` from repo root)
- sqlc (`go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`)

## Setup

```bash
cd apps/backend-go
cp .env.example .env
go mod tidy
```

## Development

```bash
# Run with hot reload (requires air)
make dev

# Or run directly
go run ./cmd/server

# Health: http://localhost:3001/api/v1/health
```

## Regenerate sqlc types

After a schema migration:

```bash
./scripts/regenerate-schema.sh
```

This runs `pnpm db:reset`, dumps the schema, and runs `sqlc generate`.

## Tests

```bash
make test
make test-coverage
```

## Build

```bash
make build
# Binary at bin/server
```

## Lint

```bash
# Requires golangci-lint
make lint
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Service-role DB connection (bypasses RLS) |
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `SUPABASE_URL` | `http://127.0.0.1:54321` | Supabase project URL for JWT validation |
| `SUPABASE_JWT_SECRET` | — | HS256 secret from `supabase status` (required for local tokens) |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Expected JWT `aud` claim |
| `TOSS_SECRET_KEY` | — | Toss Payments secret key |
| `PAYMENT_DEV_MOCK` | `false` | Accept `devmock_*` payment keys without calling Toss |

## Package Layout

```
apps/backend-go/
├── cmd/server/          # Application entrypoint
├── internal/
│   ├── api/             # Router, health, errors
│   ├── auth/            # JWT validation, authorization helpers
│   ├── config/          # Environment configuration
│   ├── db/              # pgx pool, sqlc-generated types
│   ├── properties/      # Property handlers, services, repositories
│   ├── bookings/        # Booking handlers, services, repositories
│   ├── payments/        # Payment handlers, services, repositories
│   ├── hosts/           # Host handlers, services, repositories
│   ├── admin/           # Admin handlers, services, repositories
│   ├── notifications/   # Notification handlers, services, repositories
│   └── profile/         # Profile handlers, services, repositories
├── db/
│   ├── queries/         # Hand-written SQL for sqlc
│   ├── schema/          # Dumped schema for sqlc (regenerated)
│   └── sqlc.yaml        # sqlc configuration
└── scripts/
    └── regenerate-schema.sh
```
