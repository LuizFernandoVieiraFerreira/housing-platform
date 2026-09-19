# Database ownership

Supabase SQL migrations are the only source of truth for the shared PostgreSQL schema. Python, Java, and Node ORMs **reflect** that schema. They do not evolve it.

OpenAPI in `packages/api-contract/openapi.yaml` owns the HTTP contract. It does not own tables, columns, constraints, functions, or RLS.

## Source of truth

| Artifact | Path | Owns |
| --- | --- | --- |
| SQL migrations | `supabase/migrations/` | All DDL: tables, types, indexes, constraints, functions, triggers, RLS, grants |
| Seed | `supabase/seed.sql`, `supabase/seed/` | Dev data only. Not schema. |
| Edge Functions | `supabase/functions/` | Request handlers. Not schema. |

Local Postgres is PostgreSQL 15 (`supabase/config.toml`, `[db].major_version`). Apply migrations with:

```bash
supabase start
pnpm db:reset
```

`pnpm db:reset` runs `supabase db reset` and then `scripts/post-db-reset.mjs`. Do not apply schema changes with `psql` against a long-lived database and forget the migration file. If it is not in `supabase/migrations/`, it is not schema.

### Authoring a migration

1. Add a new file. Never edit a migration that has already been applied.
2. Name it `YYYYMMDDHHMMSS_snake_description.sql`, matching the files already in `supabase/migrations/`.
3. Put related DDL in that file: columns, constraints, indexes, functions, triggers, and RLS policies the change needs.
4. Apply with `pnpm db:reset`.
5. Refresh ORM models (below) in the same change, once that backend exists.
6. Add contract or integration coverage for the behavior the change introduces.

## What each tool may do

| Tool | Role | Must not |
| --- | --- | --- |
| Supabase migrations | Own all DDL | — |
| SQLAlchemy (Python) | Reflect `public` into models | Alembic revisions, `alembic upgrade`, `MetaData.create_all()` |
| JPA / Hibernate (Java) | Reflect `public` into entities | Flyway, Liquibase, `hbm2ddl.auto` of `update`, `create`, or `create-drop` |
| Prisma (Node) | Reflect `public` via introspection | `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, a `prisma/migrations/` directory |

If a dependency pulls Flyway or Liquibase onto the classpath, disable them (`spring.flyway.enabled=false`, `spring.liquibase.enabled=false`). Do not point them at the shared database “just to baseline.”

REST backends connect with the database owner or service credentials and therefore bypass RLS. That does not make the ORM a second migration system. Authorization stays in the service layer, mapped from every policy in [authorization-matrix.md](./authorization-matrix.md). Integrity stays in PostgreSQL.

## Introspection target

After `supabase start`, the local database is:

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Port `54322` is `[db].port` in `supabase/config.toml`. Generate models only from a database that has just had `pnpm db:reset` applied, so the catalog matches `supabase/migrations/`.

Reflect the `public` schema only.

| Schema | Treatment |
| --- | --- |
| `public` | Application tables. This is the ORM surface. |
| `auth` | Supabase Auth. Do not generate a `users` entity. `profiles.id` references `auth.users`; model it as a UUID primary key, not a mapped association. |
| `storage` | Supabase Storage. Not an ORM model. |
| `extensions` | `postgis`, `vector`, `btree_gist`, `pg_net`. Reference types from here; do not create the extensions from an ORM. |
| `private` | Vault and embedding-sync helpers. SQL only. |
| `graphql_public`, `realtime`, Supabase internals | Ignore. |

### Public tables

`profiles`, `hosts`, `properties`, `rooms`, `property_images`, `room_images`, `amenities`, `property_amenities`, `platform_settings`, `bookings`, `booking_price_snapshots`, `payments`, `payment_events`, `notifications`, `housing_requests`, `audit_logs`, `location_aliases`, `property_search_embeddings`, `api_rate_limits`.

### Enums

`user_role`, `host_status`, `property_status`, `accommodation_type`, `booking_mode`, `room_status`, `booking_status`, `booking_type`, `payment_status`, `housing_request_status`, `notification_type`, `property_embedding_sync_status`.

Map these as existing PostgreSQL enums. Generators and ORMs must not emit `CREATE TYPE` on startup.

### Columns generators mishandle

Leave these as vendor types. Do not “fix” them by altering the database.

| Column | Database type | Map to |
| --- | --- | --- |
| `properties.location` | `extensions.geography(Point, 4326)` | GeoAlchemy2 `Geography`, Hibernate Spatial `geolatte` geography, Prisma `Unsupported("extensions.geography(Point,4326)")` |
| `property_search_embeddings.embedding` | `extensions.vector(1536)` | `pgvector.sqlalchemy.Vector(1536)`, a Hibernate `UserType` (`com.pgvector:pgvector`), Prisma `Unsupported("extensions.vector(1536)")` |
| `properties.tags` | `text[]` | array / `String[]` / Prisma `String[]` |
| `jsonb` columns | `jsonb` | `JSONB`, `@JdbcTypeCode(SqlTypes.JSON)`, Prisma `Json` |
| Postgres enums | enum types above | SQLAlchemy `Enum(..., create_type=False)`, `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` or `@Enumerated(EnumType.STRING)` only if the stored labels match, Prisma `enum` |

Spatial and vector reads that PostGIS or pgvector must execute belong in repository SQL (`ST_DWithin`, cosine distance). Do not reimplement them in the ORM query language.

### SQL that is not an ORM model

These stay in migrations even when no generator emits them. Do not recreate them from entity annotations or a Prisma schema.

- Row Level Security policies and `SECURITY DEFINER` functions
- Triggers (`set_updated_at`, `profiles_protect_role`, `on_auth_user_created`, price denormalization)
- Exclusion constraint `bookings_no_overlap` (`daterange` + GiST)
- Partial indexes (slug uniqueness, cover image, published-location GIST, search `tsvector`)
- The `private` schema

Prisma `migrate diff` ignores unsupported features such as triggers and exclusion constraints. A clean Prisma diff does not prove those objects still match the migrations. The migration files remain the check for them.

## Schema-change workflow

```text
edit supabase/migrations/*.sql
        │
        ▼
pnpm db:reset
        │
        ▼
regenerate ORM models from the reset database
        │
        ├── Python   sqlacodegen  → apps/backend-python/src/db/models.py
        ├── Java     hbm2java     → apps/backend-java entity package
        └── Node     prisma db pull → apps/backend-node/prisma/schema.prisma
        │
        ▼
apply the type-mapping fixes in the table above (same change)
        │
        ▼
CI: each backend fails if its models drift from the migrated database
```

Regenerate every backend that already exists. A backend that is not scaffolded yet has nothing to refresh. Do not add an empty Alembic, Flyway, Liquibase, or `prisma/migrations` tree “for later.”

## Python (SQLAlchemy)

Output, once `apps/backend-python` exists: `apps/backend-python/src/db/models.py`.

Generator: [sqlacodegen](https://github.com/agronholm/sqlacodegen) (declarative). It is a dev tool, not a runtime dependency that creates tables.

```bash
pnpm db:reset

sqlacodegen \
  "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres" \
  --generator declarative \
  --schemas public \
  --outfile apps/backend-python/src/db/models.py
```

Then, in the generated file:

- Set `schema='public'` on tables.
- Replace `properties.location` with GeoAlchemy2 `Geography(geometry_type='POINT', srid=4326, spatial_index=False)`. The GIST index already exists in SQL; `spatial_index=True` would try to create another.
- Replace the embedding column with `pgvector.sqlalchemy.Vector(1536)`.
- Pass `create_type=False` on every `Enum`.
- Do not call `MetaData.create_all()` or `metadata.drop_all()`.

Runtime engine URL is the same database, using service credentials, not the Supabase anon key.

### Python drift check

Do not install Alembic to get `alembic check`. When the backend exists, CI should:

1. Apply `supabase/migrations` to a scratch database (`supabase db reset`, or the migration files in order against the CI Postgres).
2. Import the committed models and reflect `public` with SQLAlchemy.
3. Fail if any `public` table or column is missing from the models, or if nullability or the enum/array/json/geography/vector type family disagrees.

Hand-written relationships are allowed. Missing tables are not.

## Java (JPA / Hibernate)

Output, once `apps/backend-java` exists: the entity package under `apps/backend-java` (for example `.../persistence/entity`). Entities are checked in. They are not generated on every compile.

Generator: Hibernate Tools `hbm2java`, run on demand against the reset database. Use the `org.hibernate.tool:hibernate-tools-maven` version that matches the Hibernate version Spring Boot brings. As of Hibernate ORM 7.4 the reverse-engineering goals live with Hibernate Tools; do not invent a second plugin.

`src/main/resources/hibernate.properties` for generation only (not a license to update the schema):

```properties
hibernate.connection.driver_class=org.postgresql.Driver
hibernate.connection.url=jdbc:postgresql://127.0.0.1:54322/postgres
hibernate.connection.username=postgres
hibernate.connection.password=postgres
hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
hibernate.default_schema=public
hibernate.hbm2ddl.auto=validate
```

`hibernate.reveng.xml` must include `public` and exclude `auth`, `storage`, `extensions`, `private`, and Supabase internals. Generate with JPA annotations (`ejb3=true`) into the entity package. Do not bind the goal to `generate-sources` on every build; run it when a migration changes the schema, then commit the entities.

```bash
pnpm db:reset
mvn -q -f apps/backend-java/pom.xml org.hibernate.tool:hibernate-tools-maven:hbm2java
```

After generation:

- Add `hibernate-spatial` and map `properties.location` as geography, SRID 4326. Do not let hbm2java leave it as `Serializable` or `String`.
- Map `embedding` with the pgvector JDBC `UserType`. Do not store it as `bytea` or `String`.
- Map enums to the existing PostgreSQL labels. Do not use `@Enumerated(EnumType.ORDINAL)`.
- Do not add `@Table(indexes=...)` or `@Check` annotations that Hibernate would use to emit DDL. The migration already created them. `validate` does not require those annotations.

Application configuration:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=false
spring.liquibase.enabled=false
```

`validate` is the drift check: the Spring context must fail to start when an entity does not match the migrated database. CI boots the context against a database built only from `supabase/migrations`. `none` is not an acceptable substitute; it hides drift.

## Node (Prisma)

Output, once `apps/backend-node` exists: `apps/backend-node/prisma/schema.prisma`. There is no `prisma/migrations/` directory.

Introspection command is `prisma db pull`. Client generation (`prisma generate`) only builds the TypeScript client from that schema file. It does not talk to DDL.

```bash
pnpm db:reset

cd apps/backend-node
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  npx prisma db pull
npx prisma generate
```

Datasource rules:

- `provider = "postgresql"`.
- Limit introspection to `public` with `schemas = ["public"]`. On Prisma versions that still gate this, enable only the `multiSchema` preview feature. Do not enable `postgresqlExtensions`.
- Do not set `extensions = [...]`. Supabase installs `postgis`, `vector`, and others in the `extensions` schema. Prisma’s extension tracker reports that as drift and will try to own `CREATE EXTENSION`. Extensions stay in SQL migrations.
- `db pull` overwrites `schema.prisma`. After every pull, put geography and vector back to `Unsupported(...)` before committing. That is the correct Prisma representation. Queries for those columns use `$queryRaw` in the repository.

Do not add `@@index` or `@@unique` entries in order to recreate partial indexes. Prisma cannot express `WHERE deleted_at IS NULL`. Adding a plain unique index on `properties.slug` would be a different constraint from `properties_slug_unique_idx`.

### Node drift check

`prisma migrate diff` is a read-only comparison. It must not be followed by a migrate command. Run it in CI against the migrated database.

Prisma 5 and 6:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code
```

Prisma 7 renamed the URL flags. Equivalent:

```bash
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --exit-code
```

Exit code 0 means the Prisma schema matches the database features Prisma understands. Exit code 2 is drift and must fail CI. Exit code 1 is a tool error.

This check does not cover RLS, triggers, or `bookings_no_overlap`. Those remain the SQL migrations’ responsibility.

## CI gate

When a backend is added, its pipeline must:

1. Build the database from `supabase/migrations` only.
2. Run that backend’s drift check (reflection diff, `ddl-auto=validate`, or `prisma migrate diff --exit-code`).
3. Fail the job on drift.

A green application test suite is not a schema check. The drift check is separate, and it runs against the migrated database, not against a database the ORM created.
