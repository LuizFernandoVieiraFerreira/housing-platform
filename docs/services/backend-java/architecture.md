# Java backend architecture

Spring Boot service with feature-based application packages and a shared persistence module.

## Package layout

```text
com.housingplatform/
├── features/              # Business domains (controller, service, dto, mapper)
│   ├── bookings/
│   ├── properties/
│   ├── payments/
│   ├── hosts/
│   ├── admin/
│   ├── profile/
│   └── notifications/
├── persistence/           # JPA entities, repositories, custom SQL impls
│   ├── entity/
│   ├── repository/
│   └── enums/
├── shared/                  # Cross-cutting utilities
│   └── auth/              # JWT, security, app exceptions
├── config/                # Spring configuration
└── api/                   # Health check, global exception handler
```

## Request flow

```text
Controller  →  Service  →  Repository  →  Entity
                  ↓
              DTO / Mapper
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Controller | `features/{feature}/` | HTTP routing, input validation |
| Service | `features/{feature}/` | Business rules, orchestration, transactions |
| Repository | `persistence/repository/` | Data access (Spring Data JPA) |
| Entity | `persistence/entity/` | Database table mapping |
| DTO | `features/{feature}/dto/` | API request/response shapes |
| Mapper | `features/{feature}/mapper/` | Entity/projection → DTO |

Feature packages do **not** own repositories or entities.

## Persistence conventions

- One Spring Data interface per entity in `persistence/repository/`.
- Prefer **derived query methods** and **`@Query` JPQL** for most reads/writes.
- Use **custom repository fragments** (`*Custom` + `*Impl`) only when JPQL is not enough (PostGIS search, heavy aggregations).
- Keep **`EntityManager` out of services** — only inside custom repository implementations.
- Generated entities are read-only; writes use factories in `persistence/entity/support/`.

## Dependency rules

- Features may import `persistence/` and `shared/`.
- Features must **not** import another feature's internals (e.g. no `features/payments` → `features/bookings.mapper`).
- Cross-entity workflows (e.g. payment finalization updating a booking) live in the owning feature's service and may use multiple repositories from `persistence/`.
- Controllers stay thin — no repository access.

## Business logic placement

Domain rules belong in **services**, not in SQL functions or repository classes:

- Booking pricing and validation → `BookingPricingService`, `BookingValidationService`
- Payment finalization → `PaymentFinalizationService`
- Property search → `PropertySearchService` (delegates to native SQL in `PropertySearchNativeQuery`)
