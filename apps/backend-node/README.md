# Housing Platform — Node Backend

NestJS + Prisma backend that reflects the shared Supabase PostgreSQL schema.

**Architecture:** Feature modules under `src/features/` own controllers, services, DTOs, and mappers; Prisma access lives in repositories. See [`docs/services/backend-node/architecture.md`](../../docs/services/backend-node/architecture.md).

**Schema ownership:** Supabase SQL migrations in `supabase/migrations/` are the only DDL source. This app does not use `prisma migrate`, `prisma db push`, or a `prisma/migrations/` directory.

## Prerequisites

- Node.js 20+
- pnpm (from repo root)
- Local Supabase (`pnpm db:reset` from repo root)

## Setup

```bash
cd apps/backend-node
cp .env.example .env
pnpm install
pnpm prisma:generate
```

## Development

```bash
# From repo root (via turbo)
pnpm --filter @housing-platform/backend-node dev

# Or directly
pnpm dev
# Health: http://localhost:3000/api/v1/health
```

## Regenerate Prisma schema

After a schema migration:

```bash
./scripts/regenerate-schema.sh
```

This runs `pnpm db:reset`, `prisma db pull`, post-processing (removes auth models, fixes geography/vector types), and `prisma generate`.

Manual type mappings applied after every pull:

- `properties.location` → `Unsupported("extensions.geography(Point,4326)")`
- `property_search_embeddings.embedding` → `Unsupported("extensions.vector(1536)")`
- Remove `auth` schema models; `profiles.id` stays a UUID without a relation to `auth.users`

## Tests

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Schema drift check

Compare the committed Prisma schema against a migrated database:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm prisma:diff
```

Exit code 2 indicates drift and should fail CI.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Service-role DB connection (bypasses RLS) |
| `PORT` | `3000` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `SUPABASE_URL` | `http://127.0.0.1:54321` | Supabase project URL for JWT validation |
| `SUPABASE_JWT_SECRET` | — | HS256 secret from `supabase status` (required for local tokens) |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Expected JWT `aud` claim |
| `TOSS_SECRET_KEY` | — | Toss Payments secret key |
| `PAYMENT_DEV_MOCK` | `false` | Accept `devmock_*` payment keys without calling Toss |
