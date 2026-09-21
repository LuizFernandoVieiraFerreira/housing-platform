# Housing Platform — Python Backend

FastAPI + Poetry + SQLAlchemy backend that reflects the shared Supabase PostgreSQL schema.

**Schema ownership:** Supabase SQL migrations in `supabase/migrations/` are the only DDL source. This app does not use Alembic or `MetaData.create_all()`.

## Prerequisites

- Python 3.12+
- [Poetry](https://python-poetry.org/)
- Local Supabase (`pnpm db:reset` from repo root)

## Setup

```bash
cd apps/backend-python
poetry install
cp .env.example .env
```

## Development

```bash
# From repo root (via turbo)
pnpm --filter @housing-platform/backend-python dev

# Or directly
poetry run serve
# API docs: http://localhost:8000/api/v1/docs
```

## Regenerate ORM models

After a schema migration:

```bash
pnpm db:reset
./scripts/regenerate-models.sh
```

This runs sqlacodegen against the reset database and post-processes the output into `src/housing_platform/db/models.py`.

## Tests

```bash
poetry run pytest
poetry run ruff check src tests
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres` | Service-role DB connection (bypasses RLS) |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated origins, or a JSON array |
| `DEBUG` | `false` | Enable uvicorn reload |
| `SUPABASE_URL` | `http://127.0.0.1:54321` | Supabase project URL for JWT validation |
| `SUPABASE_JWT_SECRET` | — | HS256 secret from `supabase status` (required for local tokens) |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Expected JWT `aud` claim for user access tokens |
