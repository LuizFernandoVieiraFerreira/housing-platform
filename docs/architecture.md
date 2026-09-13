# Architecture

## Overview

Vite + React 19 SPA with Supabase backend. Monorepo managed by pnpm + Turborepo.

```
housing-platform/
├── apps/web/          # React SPA
├── packages/          # Shared code
│   ├── types/         # TypeScript types
│   ├── ui/            # UI components (Radix + Tailwind)
│   ├── validation/    # Zod schemas
│   └── utils/         # Utilities (cn, clsx)
├── supabase/          # Migrations, Edge Functions
└── docs/              # This folder
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router, TanStack Query |
| Styling | Tailwind CSS, CVA |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Payments | Toss Payments |
| i18n | i18next (en, ko) |
| Observability | Sentry |

## Key Decisions

1. **Feature-based modules** — Code organized by business domain, not technical layer
2. **Layered features** — Each feature has model/api/state/hooks/components layers
3. **Result type for errors** — Explicit error handling instead of exceptions
4. **Barrel exports** — Features expose public API via index.ts
5. **No global state** — Server state in TanStack Query, form state in React Hook Form

## Related Docs

- [Security Checklist](./security-checklist.md) — Pre-deploy verification
