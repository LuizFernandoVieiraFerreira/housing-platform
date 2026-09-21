# Node backend architecture

NestJS service with feature-based modules, a shared Prisma layer, and domain logic in services (not PostgreSQL RPCs).

## Package layout

```text
src/
├── features/              # Business domains (controller, service, dto, mapper, repository)
│   ├── bookings/
│   ├── properties/
│   ├── payments/
│   ├── hosts/
│   ├── admin/
│   ├── profile/
│   └── notifications/
├── prisma/                # PrismaModule, PrismaService
├── shared/                # Cross-cutting utilities (auth, errors, rate limiting)
├── config/                # Typed configuration
├── api/                   # Health check, global filters
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma          # Introspected from Supabase migrations (read-only)
```

Each feature module typically contains:

```text
{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── {feature}.repository.ts
├── dto/
└── mappers/
```

## Request flow

```text
Controller  →  Service  →  Repository  →  Prisma / $queryRaw
                  ↓
              DTO / Mapper
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Controller | `features/{feature}/` | HTTP routing, validation pipes, guards |
| Service | `features/{feature}/` | Authorization checks, orchestration, transactions |
| Repository | `features/{feature}/` | Data access (Prisma, raw SQL for PostGIS/pgvector) |
| Schema | `prisma/schema.prisma` | Introspected mapping of shared PostgreSQL schema |
| DTO | `features/{feature}/dto/` | Request/response shapes (OpenAPI contract) |
| Mapper | `features/{feature}/mappers/` | Prisma rows → DTO |

Controllers stay thin. They resolve dependencies (guards, services) and delegate to services.

## Persistence conventions

- **Schema source of truth:** `supabase/migrations/`. No `prisma migrate`, no `prisma db push`.
- **Prisma schema:** Generated with `prisma db pull` into `prisma/schema.prisma` (via `scripts/regenerate-schema.sh` + post-processing). Treat introspected output as read-only except for documented manual fixes (geography, vector, auth schema removal).
- **Client:** One `PrismaService` per app via a global module. Repositories inject it; services receive repositories.
- **Domain logic in Node services**, not PostgreSQL RPCs. PostgreSQL functions in migrations remain for the Supabase/web client path.
- **PostGIS / pgvector:** Mapped as `Unsupported(...)` in Prisma. Spatial reads use `$queryRaw` in repositories.

## Authorization

REST connects with service credentials and **bypasses RLS**. Authorization is enforced in the service layer, mapped from [authorization-matrix.md](../../authorization-matrix.md).

| Component | Location | Role |
| --- | --- | --- |
| JWT validation | `shared/auth/` | Validate Supabase access tokens (JWKS or HS256) |
| Auth guard | `shared/auth/` | Attach `AuthUser` to request context |
| Authorization | `shared/auth/` | `AuthorizationService` with admin/host/ownership checks |

## Testing

| Layer | Method |
| --- | --- |
| Services | Vitest unit tests with mocked repositories |
| Controllers | `@nestjs/testing` + Vitest |
| Contract | `src/test/contract.test.ts` — OpenAPI route parity and error envelope |
| Authorization | `src/test/authorization.test.ts` — fail-closed checks per authorization matrix |

Run with `pnpm test` from `apps/backend-node`.
