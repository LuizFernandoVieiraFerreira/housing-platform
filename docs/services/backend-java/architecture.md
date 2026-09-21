# Java backend architecture

Spring Boot backend following standard community patterns. Unlike the Python backend (which leans on SQLAlchemy + PostgreSQL RPCs for parity with Supabase), the Java backend keeps **business logic in services** and uses **Spring Data JPA** for most persistence.

## Layering

```text
Controller  →  Service  →  Repository (Spring Data)  →  Entity
                  ↓
                DTO / Mapper
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Controller | `features/{feature}/` | HTTP routing, validation, auth guard |
| Service | `features/{feature}/` | Business rules, authorization, orchestration, transactions |
| Repository | `persistence/repository/` | One Spring Data interface per entity; custom impl only for native SQL |
| Entity | `persistence/entity/` | JPA mapping of shared PostgreSQL schema (read-only generation + manual write helpers) |
| DTO | `features/{feature}/dto/` | OpenAPI request/response shapes |
| Mapper | `features/{feature}/mapper/` | Entity/projection → DTO |

Feature packages under `features/` (`bookings/`, `properties/`, `hosts/`, …) own controllers, services, DTOs, and mappers. They do **not** own repository classes.

Cross-cutting code lives under `shared/` (`auth/`, utilities) and `config/`. Authentication, JWT validation, security filters, and app exceptions are in `shared/auth/`.

## Spring Data JPA conventions

- **One repository interface per entity** under `persistence/repository/`.
- **Derived query methods** for simple filters: `findByCustomerIdOrderByCreatedAtDesc`.
- **`@Query` JPQL** for joins and moderate complexity.
- **Custom repository fragments** (`PropertyRepositoryCustom` + `PropertyRepositoryImpl`) only when JPQL is insufficient: PostGIS search, pgvector, heavy aggregations.
- **No EntityManager in services.** EntityManager appears only inside custom repository implementations.

## Schema ownership

Supabase SQL migrations remain the sole DDL source. JPA entities reflect the schema; Hibernate `ddl-auto=validate` catches drift.

## Comparison with Python backend

| Concern | Python backend | Java backend |
| --- | --- | --- |
| Simple reads | SQLAlchemy queries / raw SQL | Spring Data derived methods |
| Pricing / validation | Often via PostgreSQL RPC | Java service code |
| Property search | `search_properties` RPC | `PropertySearchService` + `PropertySearchNativeQuery` (native SQL, PostGIS) |
| Payment finalize | PostgreSQL RPCs | `PaymentFinalizationService` (Java; pessimistic locks + JPA save) |
| Admin dashboards | Native SQL aggregations | `AdminRepositoryCustom` / `AdminRepositoryImpl` |
| Notifications side effects | `notify_*` RPCs | `NotificationService` creates rows in Java |
| Auth helpers | SQLAlchemy | `persistence/repository/ProfileRepository`, etc. |

Both backends implement the same OpenAPI contract and authorization matrix; implementation style differs by language norms.
