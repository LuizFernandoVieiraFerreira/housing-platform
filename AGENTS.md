# AGENTS.md

Agentic coding assistant instructions for housing-platform monorepo.

## Quick Reference

| What              | Command                                                            |
| ----------------- | ------------------------------------------------------------------ |
| Dev server        | `npm run dev`                                                      |
| Build all         | `npm run build`                                                    |
| Lint              | `npm run lint`                                                     |
| Typecheck         | `npm run typecheck`                                                |
| All tests         | `npm run test`                                                     |
| Single test file  | `cd apps/web && npx vitest run src/path/to/file.test.ts`           |
| Watch single test | `cd apps/web && npx vitest watch src/path/to/file.test.ts`         |
| Format code       | `npm run format`                                                   |
| Storybook         | `npm run storybook`                                                |
| Database reset    | `npm run db:reset`                                                 |
| Integration tests | `npm run test:integration`                                         |
| E2E tests         | `pnpm db:reset && pnpm test:e2e` (starts edge functions if needed) |

## Project Structure

```
housing-platform/
├── apps/web/             # Vite + React 19 SPA
├── packages/
│   ├── types/            # @housing-platform/types
│   ├── ui/               # @housing-platform/ui (Radix + Tailwind)
│   ├── validation/       # @housing-platform/validation (Zod)
│   └── utils/            # @housing-platform/utils
├── supabase/             # Migrations (DDL source of truth), Edge Functions
├── docs/                 # Architecture, patterns, conventions
└── tests/integration/
```

## Non-Negotiables

1. **TypeScript strict** — No `any`, `@ts-ignore`, `@ts-expect-error`
2. **Layered features** — `model/ ← api/ ← state/ ← hooks/ ← components/`
3. **Barrel imports** — Cross-feature: `@/features/auth`, never deep paths
4. **Result type in API** — Return `Result<T>`, use `unwrap()` at hook boundary
5. **No global state** — Server state in TanStack Query, form state in RHF
6. **One schema owner** — `supabase/migrations/` is the only DDL source
7. **Colocated tests** — `Component.tsx` → `Component.test.tsx`

## Git Workflow

**Branch**: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`

**Commit**: `<type>: <subject>` — types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

## Docs Reference

Read from `docs/` when relevant context is needed. **Trust docs over code patterns.**

| Situation                      | Document                       |
| ------------------------------ | ------------------------------ |
| Architecture overview          | `docs/architecture.md`         |
| Feature layers & structure     | `docs/layers.md`               |
| Error handling, queries, forms | `docs/patterns.md`             |
| Naming, imports, testing       | `docs/conventions.md`          |
| Security pre-deploy            | `docs/security-checklist.md`   |
| Database migrations            | `docs/database-ownership.md`   |
| RLS / permissions              | `docs/authorization-matrix.md` |

## File Reference

| Need             | File                                |
| ---------------- | ----------------------------------- |
| Result type      | `apps/web/src/shared/lib/result.ts` |
| Error helpers    | `apps/web/src/shared/lib/errors.ts` |
| Logger           | `apps/web/src/shared/lib/logger.ts` |
| Supabase client  | `apps/web/src/shared/api/supabase.ts` |
| Query keys       | `apps/web/src/shared/api/query-keys.ts` |
