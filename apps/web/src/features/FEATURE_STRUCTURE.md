# Feature Structure Guidelines

This document defines the standard structure for feature modules in this application.

## Standard Feature Structure

```
features/<feature-name>/
├── api/           # Data fetching, API calls, Supabase queries
│   └── <name>-api.ts
├── components/    # React components scoped to this feature
│   └── <ComponentName>.tsx
├── hooks/         # React hooks scoped to this feature
│   └── use<HookName>.ts
├── lib/           # Pure utilities, helpers, constants, types
│   └── <name>-utils.ts
├── pages/         # Route-level page components (if feature has routes)
│   └── <PageName>Page.tsx
├── layouts/       # Layout wrappers (if feature has nested routing)
│   └── <LayoutName>Layout.tsx
├── context/       # React Context providers (when needed)
│   └── <ContextName>Provider.tsx
└── index.ts       # Public API - barrel export for cross-feature imports
```

## Folder Guidelines

### Required for Every Feature
- `index.ts` — Public API barrel export. Other features import from here.

### Include When Needed
| Folder | Include when... |
|--------|-----------------|
| `api/` | Feature fetches data from Supabase or external APIs |
| `components/` | Feature has reusable UI components |
| `hooks/` | Feature has React hooks (queries, mutations, state) |
| `pages/` | Feature owns route(s) in the app |
| `layouts/` | Feature has nested routes with shared UI |
| `lib/` | Feature has utilities, constants, or complex types |
| `context/` | Feature needs React Context for state sharing |

### Do NOT Create Empty Folders
Only add folders when they contain files. This keeps the structure clean.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Feature folder | `kebab-case` | `booking/`, `home/` |
| API files | `<feature>-api.ts` | `booking-api.ts` |
| Components | `PascalCase.tsx` | `BookingPanel.tsx` |
| Hooks | `use<Name>.ts` | `useBooking.ts` |
| Pages | `<Name>Page.tsx` | `CheckoutPage.tsx` |
| Layouts | `<Name>Layout.tsx` | `AdminLayout.tsx` |
| Utils | `<feature>-utils.ts` | `booking-utils.ts` |
| Types | `types.ts` or inline | `types.ts` |

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
