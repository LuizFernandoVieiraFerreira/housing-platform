# AGENTS.md

Agentic coding assistant instructions for housing-platform monorepo.

## Quick Reference

| What              | Command                                                    |
| ----------------- | ---------------------------------------------------------- |
| Dev server        | `npm run dev`                                              |
| Build all         | `npm run build`                                            |
| Lint              | `npm run lint`                                             |
| Typecheck         | `npm run typecheck`                                        |
| All tests         | `npm run test`                                             |
| Single test file  | `cd apps/web && npx vitest run src/path/to/file.test.ts`   |
| Watch single test | `cd apps/web && npx vitest watch src/path/to/file.test.ts` |
| Format code       | `npm run format`                                           |
| Storybook         | `npm run storybook`                                        |
| Database reset    | `npm run db:reset`                                         |
| Integration tests | `npm run test:integration`                                 |

## Project Structure

```
housing-platform/
├── apps/
│   └── web/              # Vite + React 19 SPA (main app)
├── packages/
│   ├── config/           # Shared ESLint/TypeScript configs
│   ├── types/            # Shared TypeScript types (@housing-platform/types)
│   ├── ui/               # Shared UI components (@housing-platform/ui)
│   ├── utils/            # Shared utilities (@housing-platform/utils)
│   └── validation/       # Zod schemas (@housing-platform/validation)
├── supabase/             # Supabase migrations, functions, seed data
└── tests/integration/    # Integration tests
```

## Code Style

- **Formatter**: Prettier (2-space indent, single quotes, trailing commas)
- **Linter**: ESLint 9 flat config
- **Check before commit**: `npm run lint && npm run typecheck`

### Naming Conventions

| Item            | Convention                        | Example                            |
| --------------- | --------------------------------- | ---------------------------------- |
| Files/folders   | kebab-case                        | `booking-api.ts`, `auth-provider/` |
| Components      | PascalCase (match kebab filename) | `BookingPanel`, `AuthProvider`     |
| Props interface | `{ComponentName}Props`            | `BookingPanelProps`                |
| Hooks           | camelCase with `use` prefix       | `useAuth`, `useBookingQuote`       |
| API files       | `<feature>-api.ts`                | `booking-api.ts`                   |
| Utility files   | `<feature>-utils.ts`              | `booking-utils.ts`                 |
| Test files      | `<name>.test.ts(x)`               | `BookingPanel.test.tsx`            |
| Constants       | SCREAMING_SNAKE_CASE              | `SEOUL_CENTER`                     |

## Feature Module Structure

Features use a **layered architecture** with clear dependency rules:

```
features/<feature-name>/
├── model/         # Layer 0: Pure domain (no React/i18n)
│   ├── types.ts       # Types, interfaces
│   ├── schemas.ts     # Zod validation
│   ├── constants.ts   # Business rules, config
│   └── utils.ts       # Pure utility functions
├── api/           # Layer 1: Data access
│   ├── <name>-api.ts  # Supabase queries
│   └── mappers.ts     # Row → Model transformations
├── state/         # Layer 2: Client state
│   └── use-<name>-form.ts  # Form state hooks
├── hooks/         # Layer 3: Composition
│   └── use<Name>.ts   # React Query + state
├── components/    # Layer 4: UI rendering
│   └── <Name>.tsx
├── lib/           # Utilities with i18n/formatting
│   └── <name>-utils.ts
├── pages/         # Route-level pages
│   └── <Name>Page.tsx
└── index.ts       # Public API barrel export
```

### Layer Dependency Rules

```
model/ ← api/ ← state/ ← hooks/ ← components/
```

| Layer | Can Import | Purpose |
|-------|------------|---------|
| `model/` | Nothing | Pure types, schemas, constants |
| `api/` | `model/` | Data fetching, mappers |
| `state/` | `model/` | Client state management |
| `hooks/` | `model/`, `api/`, `state/` | Query + state composition |
| `components/` | All layers | UI rendering |

### Import Rules

**✅ Correct — Use barrel exports for cross-feature imports:**

```typescript
import { useAuth, AuthProvider } from '@/features/auth';
import { useBookingQuote, formatKrw } from '@/features/booking';
```

**❌ Incorrect — Never deep import from another feature:**

```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';
```

**Within same feature, relative imports are allowed:**

```typescript
// Inside features/auth/context/AuthProvider.tsx
import { signOut } from '../api/auth-api';
```

### Available Features

| Feature                    | Key Exports                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `@/features/auth`          | `useAuth`, `AuthProvider`, `GuestRoute`, `ProtectedRoute`       |
| `@/features/account`       | `useCurrentProfile`, `AccountLayout`                            |
| `@/features/admin`         | `isAdminProfile`, `AdminRoute`, `AdminLayout`                   |
| `@/features/booking`       | `useBookingQuote`, `useMyBookings`, `BookingPanel`, `formatKrw` |
| `@/features/host`          | `useCurrentHost`, `isHostProfile`, `HostRoute`, `HostLayout`    |
| `@/features/search`        | `usePropertySearch`, `buildSearchParams`, `SEOUL_CENTER`        |
| `@/features/notifications` | `useNotifications`, `NotificationProvider`                      |

## TypeScript

- **Strict mode**: Enabled
- **No type suppression**: Avoid `as any`, `@ts-ignore`, `@ts-expect-error`
- **Props**: Define with `interface`, place above component
- **Zod**: Use for runtime validation, types in `@housing-platform/validation`

## Error Handling

Use the unified error handling pattern from `@/shared/lib/errors`:

```typescript
// In API files
import { wrapSupabaseError } from '@/shared/lib/errors';

const { data, error } = await supabase.from('table').select();
if (error) {
  throw wrapSupabaseError(error, 'Unable to load data');
}
```

```typescript
// In components
import { getErrorMessage } from '@/shared/lib/errors';

catch (error) {
  setError(getErrorMessage(error, 'Something went wrong'));
}
```

### Result Type (for complex flows)

```typescript
import { Result, AppError, isOk } from '@/shared/lib/result';

async function fetchDataSafe(): Promise<Result<Data>> {
  const { data, error } = await supabase.from('table').select();
  if (error) return Result.err(AppError.fromSupabase(error, 'Fetch failed'));
  return Result.ok(data);
}

const result = await fetchDataSafe();
if (isOk(result)) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

## Data Fetching

### TanStack Query Patterns

```typescript
// Query keys in features/<feature>/keys.ts
export const bookingKeys = {
  all: ['booking'] as const,
  quotes: () => [...bookingKeys.all, 'quote'] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

// Hooks in features/<feature>/hooks/
export function useBookingDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId!),
    queryFn: () => fetchBookingDetail(bookingId!),
    enabled: Boolean(bookingId),
  });
}
```

### Supabase Integration

- Client: `@/shared/api/supabase`
- Always handle errors with `wrapSupabaseError()`
- Use RPC functions for complex queries

## Logging

Use structured logging from `@/shared/lib/logger`:

```typescript
import { logger } from '@/shared/lib/logger';

// Basic logging
logger.info('User signed in', { userId: user.id });
logger.error('Payment failed', { error, orderId });

// Child logger for component context
const log = logger.child({ component: 'CheckoutPage' });
log.debug('Processing payment');
```

## State Management

| Type           | Tool                  | Location                 |
| -------------- | --------------------- | ------------------------ |
| Server state   | TanStack Query        | `features/*/hooks/`      |
| Auth state     | React Context         | `features/auth/context/` |
| Form state     | React Hook Form + Zod | Component level          |
| Local UI state | `useState`            | Component level          |
| URL state      | React Router          | `useSearchParams`        |

**Rules:**

- Don't duplicate server state in local state
- No global state libraries (Redux, Zustand)

## Styling

- **Framework**: Tailwind CSS 3.4
- **Component variants**: `class-variance-authority` (CVA)
- **UI library**: `@housing-platform/ui` (shared components)

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center rounded-md', {
  variants: {
    variant: {
      primary: 'bg-brand-500 text-white',
      secondary: 'bg-surface-subtle text-ink',
    },
  },
  defaultVariants: { variant: 'primary' },
});
```

## Testing

### Test File Location

- Place tests next to source files: `Component.tsx` → `Component.test.tsx`
- Use `src/test/` for shared test utilities and fixtures

### Testing Patterns

```typescript
// Component tests
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('submits form with valid data', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

```typescript
// Hook tests
import { renderHook, waitFor } from '@testing-library/react';

it('fetches booking data', async () => {
  const { result } = renderHook(() => useBookingDetail('123'), {
    wrapper: createTestWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.id).toBe('123');
});
```

### Test Fixtures

```typescript
// src/test/fixtures/property.ts
import type { PropertyDetail } from '@housing-platform/types';

export function createPropertyDetail(overrides?: Partial<PropertyDetail>): PropertyDetail {
  return {
    id: 'prop-1',
    title: 'Test Property',
    // ... defaults
    ...overrides,
  };
}
```

### Run Tests

```bash
# All tests
npm run test

# Single file
cd apps/web && npx vitest run src/features/auth/hooks/useAuth.test.ts

# Watch mode
cd apps/web && npx vitest watch src/features/auth

# With coverage
cd apps/web && npx vitest run --coverage
```

## i18n (Internationalization)

- **Library**: i18next + react-i18next
- **Languages**: English (`en`), Korean (`ko`)
- **Namespace files**: `src/i18n/locales/{lang}/{namespace}.json`

```typescript
import { useTranslation } from 'react-i18next';

function BookingPanel() {
  const { t } = useTranslation('booking');
  return <h2>{t('title')}</h2>;
}
```

## Git Workflow

**Branch naming**: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`

**Commit format**: `<type>: <subject>`

| Type     | Description      |
| -------- | ---------------- |
| feat     | New feature      |
| fix      | Bug fix          |
| refactor | Code refactoring |
| docs     | Documentation    |
| chore    | Config/tooling   |
| test     | Tests            |

## Shared Packages

| Package                        | Import                 | Purpose                 |
| ------------------------------ | ---------------------- | ----------------------- |
| `@housing-platform/types`      | Types, interfaces      | Shared TypeScript types |
| `@housing-platform/ui`         | `Button`, `Card`, etc. | Shared UI components    |
| `@housing-platform/validation` | Zod schemas            | Form/API validation     |
| `@housing-platform/utils`      | Utility functions      | Shared helpers          |

## File Reference

| Need                    | File                                               |
| ----------------------- | -------------------------------------------------- |
| Feature structure guide | `apps/web/src/features/FEATURE_STRUCTURE.md`       |
| Import rules            | `.cursor/rules/feature-imports.mdc`                |
| Result type docs        | `apps/web/src/shared/lib/result.ts` (top comments) |
| Error handling          | `apps/web/src/shared/lib/errors.ts`                |
| Logging                 | `apps/web/src/shared/lib/logger.ts`                |
| Query keys              | `apps/web/src/shared/api/query-keys.ts`            |
