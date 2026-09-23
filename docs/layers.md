# Feature Layers

Features use a **layered architecture** with clear dependency rules.

## Structure

```
features/<feature-name>/
├── model/           # Layer 0: Pure domain (no React/i18n)
│   ├── types.ts         # Types, interfaces
│   ├── schemas.ts       # Zod validation
│   ├── constants.ts     # Business rules, config
│   └── utils.ts         # Pure functions
├── api/             # Layer 1: Data access
│   ├── <name>-api.ts    # Supabase queries, returns Result<T>
│   └── mappers.ts       # Row → Model transformations
├── state/           # Layer 2: Client state
│   └── use-<name>-form.ts
├── hooks/           # Layer 3: Composition
│   └── use<Name>.ts     # React Query + state → UI interface
├── components/      # Layer 4: UI rendering
│   └── <Name>.tsx
├── lib/             # Utilities with i18n/formatting deps
├── pages/           # Route-level pages
├── context/         # React Context (when needed)
└── index.ts         # Public API barrel export
```

## Dependency Rules

```
model/ ← api/ ← state/ ← hooks/ ← components/
```

| Layer         | Can Import                 | Contains                             |
| ------------- | -------------------------- | ------------------------------------ |
| `model/`      | Nothing                    | Types, schemas, constants, pure utils |
| `api/`        | `model/`                   | Supabase queries, mappers            |
| `state/`      | `model/`                   | Form state hooks                     |
| `hooks/`      | `model/`, `api/`, `state/` | React Query hooks, presenters        |
| `components/` | All layers                 | UI rendering                         |
| `lib/`        | `model/`, external deps    | Utilities with i18n/formatters       |

## Layer Guidelines

### model/ (Pure Domain)

**Rules:**
- No React imports
- No i18n dependencies
- No API calls
- 100% testable without mocking

```typescript
// model/constants.ts
export const MAX_GUEST_COUNT = 16;
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

// model/utils.ts — pure functions only
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}
```

### api/ (Data Access)

Return `Result<T>` for recoverable failures. See `docs/patterns.md` for full error handling guide.

```typescript
// api/booking-api.ts
export async function fetchBooking(id: string): Promise<Result<Booking>> {
  const { data, error } = await supabase.from('bookings').select().eq('id', id).single();
  if (error) return Result.err(AppError.fromSupabase(error, 'Unable to load booking'));
  return Result.ok(mapBookingRow(data));
}
```

**Mappers convert:**
- Supabase rows (snake_case) → Domain models (camelCase)
- Form values → API request params

### hooks/ (Presenters)

Combine API + state into UI-ready interface. Use `unwrap()` at the React Query boundary.

```typescript
// hooks/useBookingPanel.ts
export function useBookingPanel({ property }: Props) {
  const form = useBookingForm({ propertyId: property.id });
  const quote = useBookingQuote(form.quoteInput);
  const mutation = useCreateBooking();

  const state = useMemo(() => {
    if (!isAuthenticated) return { status: 'unauthenticated' } as const;
    if (!isVerified) return { status: 'unverified' } as const;
    return { status: 'ready' } as const;
  }, [isAuthenticated, isVerified]);

  return { state, form, quote, handleSubmit: mutation.mutate };
}
```

### components/ (UI)

- Receive data from hooks
- No business logic
- Small, focused components

```typescript
// components/BookingPanel.tsx
export function BookingPanel({ property }: Props) {
  const presenter = useBookingPanel({ property });

  switch (presenter.state.status) {
    case 'unauthenticated':
      return <BookingUnauthenticated />;
    case 'ready':
      return <BookingForm {...presenter} />;
  }
}
```

## Import Rules

### Cross-feature: Barrel exports only

```typescript
// ✅ Correct
import { useAuth, AuthProvider } from '@/features/auth';
import { useBookingQuote } from '@/features/booking';

// ❌ Incorrect — never deep import from another feature
import { useAuth } from '@/features/auth/hooks/useAuth';
```

### Within same feature: Relative imports OK

```typescript
// Inside features/auth/context/AuthProvider.tsx
import { signOut } from '../api/auth-api';
```

## Folder Guidelines

Only add folders when they contain files. Required for every feature:

- `index.ts` — Public API barrel export

Include when needed:

| Folder       | Include when...                           |
| ------------ | ----------------------------------------- |
| `model/`     | Complex types, business rules, pure logic |
| `api/`       | Fetches from Supabase or external APIs    |
| `state/`     | Form state or complex client state        |
| `hooks/`     | React Query hooks                         |
| `components/`| Reusable UI components                    |
| `lib/`       | Utilities with i18n/formatting deps       |
| `pages/`     | Feature owns route(s)                     |
| `context/`   | React Context for state sharing           |

## Current Features

| Feature         | Purpose                                    |
| --------------- | ------------------------------------------ |
| `auth`          | Authentication, login, signup, session     |
| `account`       | User profile, bookings list                |
| `admin`         | Admin console, platform ops                |
| `booking`       | Booking creation, quotes, panel            |
| `checkout`      | Payment flow                               |
| `home`          | Landing page                               |
| `host`          | Host portal, property management           |
| `listings`      | Property detail pages                      |
| `notifications` | User notifications                         |
| `platforms`     | Professional platform landing pages        |
| `search`        | Map search, property search                |
| `support`       | Messages, customer support                 |
