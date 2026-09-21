# Housing Platform — Java Backend

Spring Boot + JPA backend that reflects the shared Supabase PostgreSQL schema.

**Schema ownership:** Supabase SQL migrations in `supabase/migrations/` are the only DDL source. This app does not use Flyway, Liquibase, or Hibernate schema update/create modes.

## Prerequisites

- Java 21+
- [Maven](https://maven.apache.org/) 3.9+
- Local Supabase (`pnpm db:reset` from repo root)

## Setup

```bash
cd apps/backend-java
cp .env.example .env
mvn -q -DskipTests package
```

## Development

```bash
# From repo root (via turbo)
pnpm --filter @housing-platform/backend-java dev

# Or directly
mvn spring-boot:run
# Health: http://localhost:8080/api/v1/health
```

## Regenerate JPA entities

After a schema migration:

```bash
pnpm db:reset
./scripts/regenerate-entities.sh
```

Then re-apply manual mappings documented in `docs/database-ownership.md`:

- `properties.location` → Hibernate Spatial geography (SRID 4326)
- `property_search_embeddings.embedding` → `com.pgvector.PGvector`
- PostgreSQL enums → `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` or converters
- Do not add Flyway/Liquibase or `@Table(indexes=...)` DDL annotations

## Tests

```bash
# Unit tests (no database required)
mvn test

# Include schema validation against local Supabase
mvn test -Dgroups=integration
```

`spring.jpa.hibernate.ddl-auto=validate` is the drift check: the Spring context fails to start when entities do not match the migrated database.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://127.0.0.1:54322/postgres` | Service-role DB connection (bypasses RLS) |
| `DATABASE_USERNAME` | `postgres` | Database user |
| `DATABASE_PASSWORD` | `postgres` | Database password |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `SUPABASE_URL` | `http://127.0.0.1:54321` | Supabase project URL for JWT validation |
| `SUPABASE_JWT_SECRET` | — | HS256 secret from `supabase status` (required for local tokens) |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Expected JWT `aud` claim |
| `TOSS_SECRET_KEY` | — | Toss Payments secret key |
| `PAYMENT_DEV_MOCK` | `false` | Accept `devmock_*` payment keys without calling Toss |
