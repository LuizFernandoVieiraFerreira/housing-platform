# Patterns

## Error Handling

Central module: `@/shared/lib/errors` (re-exports `Result`, `AppError`, `unwrap`, etc. from `result.ts`).

### The `Result<T>` pattern

API functions return `Result<T>` instead of throwing for **expected** failures (network errors, 404s, validation failures). A `Result` is either:

- `{ ok: true, data: T }` — success
- `{ ok: false, error: AppError }` — failure

This is the same idea as Rust's `Result<T, E>` or functional programming's `Either` — sometimes called **explicit error handling** or **railway-oriented programming**. Errors become part of the type signature, so callers must acknowledge them.

**Reference implementations:** `booking-api.ts` and `payment-api.ts`. Other API files may still throw via `wrapSupabaseError`; migrate them to `Result` when touched.

### Layer boundaries

Each layer has one job. Do not mix throw + `Result` in the same function.

```
Component          Hook (useQuery / useMutation)       API (*-api.ts)
─────────          ─────────────────────────────       ──────────────
uses data,         calls API, then unwrap()            returns Result<T>
isError, error     to bridge into TanStack Query       never throws for
from hooks                                              expected failures
```

| Layer                   | Returns / uses                                       | Why                                               |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **API** (`*-api.ts`)    | `Promise<Result<T>>`                                 | Failures are typed and testable without try/catch |
| **Hooks** (`useXxx.ts`) | `unwrap(await fn())` inside `queryFn` / `mutationFn` | TanStack Query expects return-or-throw            |
| **Components**          | `data`, `isError`, `error` from hooks                | No `Result` awareness needed                      |
| **Tests**               | `result.ok` / `result.error` directly                | Assert outcomes without expecting throws          |

### When to use `unwrap()` vs handle `Result` directly

**Use `unwrap()`** at the hook boundary when TanStack Query should own error state:

```typescript
// hooks/useBooking.ts
import { unwrap } from '@/shared/lib/errors';

queryFn: async () => unwrap(await fetchBookingDetail(bookingId)),
```

`unwrap()` returns `data` on success and **throws** `error` on failure — intentionally converting typed errors back into exceptions for React Query.

**Handle `Result` directly** when you want recovery without throwing:

```typescript
// Tests
const result = await quoteBooking(input);
expect(result.ok).toBe(false);
if (!result.ok) expect(result.error.code).toBe('BOOKING_UNAVAILABLE');

// UI with inline recovery (no React Query)
const result = await quoteBooking(input);
if (result.ok) {
  setQuote(result.data);
} else {
  setInlineMessage(result.error.message);
}

// Chaining API calls
const detail = await fetchBookingDetail(id);
return flatMap(detail, (booking) => cancelOwnBooking(booking.id));
```

**Rule of thumb:** `unwrap()` at the TanStack Query boundary; `result.ok` everywhere else.

### In API layer

Return `Result` for recoverable failures. Use structured `AppError` codes:

```typescript
import { AppError, Result } from '@/shared/lib/errors';

export async function quoteBooking(input: QuoteInput): Promise<Result<BookingQuote>> {
  const { data, error } = await supabase.rpc('quote_booking', toQuoteRequest(input));

  if (error) {
    return Result.err(AppError.fromSupabase(error, 'Unable to quote this stay'));
  }

  const row = extractFirstQuoteRow(data);
  if (!row) {
    return Result.err(new AppError('BOOKING_UNAVAILABLE', 'Unable to quote this stay'));
  }

  return Result.ok(mapQuoteRow(row));
}
```

**Naming:** use normal function names (e.g. `quoteBooking`). The return type `Promise<Result<T>>` is the contract — no suffix needed.

**Do not** mix throw + `Result` in the same function. When migrating a throwing API, switch it to `Result` and update callers in one pass.

### In components

For data loaded via hooks, use TanStack Query's built-in error state — no `unwrap()` in components.

For local mutations (forms, one-off actions), use `useErrorState`:

```typescript
import { useErrorState } from '@/shared/hooks';

const { error, handleError, clearError } = useErrorState();

const mutation = useMutation({
  mutationFn: saveData,
  onError: handleError('Unable to save'),
});

// In JSX
{error && <Alert variant="error">{error}</Alert>}
```

### Extracting messages

```typescript
import { getErrorMessage } from '@/shared/lib/errors';

catch (err) {
  setError(getErrorMessage(err, 'Something went wrong'));
}
```

## Data Fetching

TanStack Query with colocated keys. Hooks bridge `Result`-returning API functions via `unwrap()` — see [Error Handling](#error-handling) above.

```typescript
// keys.ts
export const bookingKeys = {
  all: ['booking'] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

// hooks/useBooking.ts
import { unwrap } from '@/shared/lib/errors';
import { fetchBookingDetail } from '../api/booking-api';

export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => unwrap(await fetchBookingDetail(id)),
    enabled: Boolean(id),
  });
}
```

## Form State

React Hook Form + Zod in state layer:

```typescript
// state/use-booking-form.ts
export function useBookingForm(options) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });

  return { form, quoteInput, canSubmit };
}
```

## Presenter Pattern

Hook that combines data + logic for UI:

```typescript
// hooks/useBookingPanel.ts
export function useBookingPanel({ property }) {
  const form = useBookingForm(...);
  const quote = useBookingQuote(...);

  const state = useMemo(() => {
    if (!isAuthenticated) return { status: 'unauthenticated' };
    if (!isVerified) return { status: 'unverified' };
    return { status: 'ready' };
  }, [...]);

  return { state, form, quote, handleSubmit, ... };
}
```

## Component Composition

Split large components into focused pieces:

```typescript
// BookingPanel.tsx
function BookingPanel({ property }) {
  const presenter = useBookingPanel({ property });

  switch (presenter.state.status) {
    case 'unauthenticated':
      return <BookingUnauthenticated {...} />;
    case 'ready':
      return <BookingForm {...} />;
  }
}
```

## Logging

Structured logging with context:

```typescript
import { logger } from '@/shared/lib/logger';

const log = logger.child('booking-api');
log.info('Creating booking', { roomId, checkIn });
```

## Provider Composition

Use `composeProviders` to flatten nested providers:

```typescript
import { composeProviders } from '@/app/providers/composeProviders';

// Before (deeply nested)
<QueryClientProvider client={client}>
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
</QueryClientProvider>

// After (flat and readable)
const CoreProviders = composeProviders([
  [QueryClientProvider, { client }],  // with props
  AuthProvider,                        // no props
  ThemeProvider,
]);

<CoreProviders>{children}</CoreProviders>
```

Provider order: first in list = outermost in tree.
