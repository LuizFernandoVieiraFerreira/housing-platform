# Feature Structure Guidelines

This document defines the standard structure for feature modules in this application.

## Layered Feature Structure

Features use a **layered architecture** with clear dependency rules:

```
features/<feature-name>/
├── model/         # Layer 0: Pure domain (types, schemas, constants, pure utils)
│   ├── types.ts       # Types and interfaces
│   ├── schemas.ts     # Zod validation schemas
│   ├── constants.ts   # Business constants and config
│   ├── utils.ts       # Pure utility functions (no React/i18n)
│   └── index.ts       # Model layer barrel export
├── api/           # Layer 1: Data access (fetching, mappers)
│   ├── <name>-api.ts  # Supabase queries, API calls
│   ├── mappers.ts     # Row → Model transformations
│   └── index.ts       # API layer barrel export
├── state/         # Layer 2: Client state (forms, local state)
│   ├── use-<name>-form.ts  # Form state hooks
│   └── index.ts       # State layer barrel export
├── hooks/         # Layer 3: Composition (queries + state → UI interface)
│   └── use<Name>.ts   # React Query hooks, combined logic
├── components/    # Layer 4: UI rendering
│   └── <ComponentName>.tsx
├── lib/           # Utilities with dependencies (i18n, formatters)
│   └── <name>-utils.ts
├── pages/         # Route-level page components
│   └── <Name>Page.tsx
├── context/       # React Context providers (when needed)
│   └── <Name>Provider.tsx
└── index.ts       # Public API - barrel export for cross-feature imports
```

## Layer Dependency Rules

```
model/ ← api/ ← state/ ← hooks/ ← components/
  ↑       ↑       ↑        ↑          ↑
  │       │       │        │          └── Can import from all layers
  │       │       │        └── Can import from model, api, state
  │       │       └── Can import from model
  │       └── Can import from model
  └── No internal dependencies (pure)
```

| Layer | Can Import From | Purpose |
|-------|-----------------|---------|
| `model/` | Nothing (pure) | Types, schemas, constants, pure utils |
| `api/` | `model/` | Data fetching, mappers |
| `state/` | `model/` | Client-side state management |
| `hooks/` | `model/`, `api/`, `state/` | React Query + state composition |
| `components/` | All layers | UI rendering |
| `lib/` | `model/`, external deps | Utilities with i18n/formatting |

## Layer Guidelines

### model/ (Pure Domain)

**Required for complex features.** Contains:
- `types.ts` — Re-export shared types + feature-local types
- `schemas.ts` — Re-export Zod schemas from validation package
- `constants.ts` — Business rules, config values, status groups
- `utils.ts` — Pure functions (no React, no i18n)

**Rules:**
- No React imports
- No i18n dependencies
- Fully testable without mocking

### api/ (Data Access)

Contains:
- `<name>-api.ts` — Supabase queries, Result-returning functions
- `mappers.ts` — Row-to-model transformations

### state/ (Client State)

Contains:
- `use-<name>-form.ts` — Form state with React Hook Form
- Local state hooks (if needed)

### hooks/ (Composition)

Contains:
- React Query hooks (`useQuery`, `useMutation`)
- Combines api + state → UI-ready interface

## Folder Guidelines

### Required for Every Feature
- `index.ts` — Public API barrel export

### Include When Needed
| Folder | Include when... |
|--------|-----------------|
| `model/` | Feature has complex types, business rules, or pure logic |
| `api/` | Feature fetches data from Supabase or external APIs |
| `state/` | Feature has form state or complex client state |
| `hooks/` | Feature has React Query hooks |
| `components/` | Feature has reusable UI components |
| `lib/` | Feature has utilities with i18n/formatting dependencies |
| `pages/` | Feature owns route(s) in the app |
| `context/` | Feature needs React Context for state sharing |

### Do NOT Create Empty Folders
Only add folders when they contain files. This keeps the structure clean.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Feature folder | `kebab-case` | `booking/`, `home/` |
| Model types | `types.ts` | `model/types.ts` |
| Model schemas | `schemas.ts` | `model/schemas.ts` |
| Model constants | `constants.ts` | `model/constants.ts` |
| Model utils | `utils.ts` | `model/utils.ts` |
| API files | `<feature>-api.ts` | `api/booking-api.ts` |
| Mappers | `mappers.ts` | `api/mappers.ts` |
| State hooks | `use-<name>-form.ts` | `state/use-booking-form.ts` |
| Query hooks | `use<Name>.ts` | `hooks/useBooking.ts` |
| Components | `PascalCase.tsx` | `BookingPanel.tsx` |
| Pages | `<Name>Page.tsx` | `CheckoutPage.tsx` |
| Layouts | `<Name>Layout.tsx` | `AdminLayout.tsx` |
| Utils (with deps) | `<feature>-utils.ts` | `lib/booking-utils.ts` |

## Import Rules

### ✅ Allowed Imports
```typescript
// From another feature's public API
import { useAuth } from '@/features/auth';

// From shared code
import { Button } from '@housing-platform/ui';
import { supabase } from '@/shared/api/supabase';

// Within the same feature (any path)
import { BookingPanel } from './components/BookingPanel';
```

### ❌ Forbidden Imports
```typescript
// Deep imports into another feature's internals
import { useAuth } from '@/features/auth/hooks/useAuth'; // BAD

// Always use the barrel export
import { useAuth } from '@/features/auth'; // GOOD
```

## Feature Checklist

When creating a new feature:

1. [ ] Create feature folder: `features/<name>/`
2. [ ] Create `index.ts` with public exports
3. [ ] Add folders only as needed
4. [ ] Follow naming conventions
5. [ ] Export public API from `index.ts`

## Current Features

| Feature | Purpose |
|---------|---------|
| `account` | User account management, profile, bookings list |
| `admin` | Admin console, platform operations |
| `auth` | Authentication, login, signup, session management |
| `booking` | Booking creation, quotes, booking panel |
| `checkout` | Payment flow, checkout pages |
| `home` | Home page, hero section, landing components |
| `host` | Host portal, property management |
| `listings` | Property detail pages |
| `notifications` | User notifications |
| `platforms` | Professional platform landing pages |
| `search` | Map search, property search |
| `support` | Messages, customer support |
