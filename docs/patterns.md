# Patterns

## Error Handling

Central module: `@/shared/lib/errors`

### In API layer

**Throwing (for TanStack Query):**
```typescript
import { wrapSupabaseError } from '@/shared/lib/errors';

if (error) {
  throw wrapSupabaseError(error, 'Unable to load data');
}
```

**Result pattern (explicit handling):**
```typescript
import { AppError, Result } from '@/shared/lib/errors';

if (error) return Result.err(AppError.fromSupabase(error, 'Failed'));
return Result.ok(data);
```

### In components

Use `useErrorState` hook:
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

TanStack Query with colocated keys:

```typescript
// keys.ts
export const bookingKeys = {
  all: ['booking'] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

// hooks/useBooking.ts
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => fetchBookingDetail(id),
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
