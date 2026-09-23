# Conventions

## Naming

| Type            | Convention                        | Example                     |
| --------------- | --------------------------------- | --------------------------- |
| Files/folders   | kebab-case                        | `booking-api.ts`            |
| Components      | PascalCase (match kebab filename) | `BookingPanel.tsx`          |
| Props interface | `{ComponentName}Props`            | `BookingPanelProps`         |
| Hooks           | camelCase, `use` prefix           | `useBookingPanel.ts`        |
| API files       | `<feature>-api.ts`                | `booking-api.ts`            |
| Utility files   | `<feature>-utils.ts`              | `booking-utils.ts`          |
| Test files      | `<name>.test.ts(x)`               | `BookingPanel.test.tsx`     |
| Constants       | SCREAMING_SNAKE_CASE              | `MAX_GUEST_COUNT`           |
| Types           | PascalCase                        | `BookingStatus`             |

## Imports

Grouped and ordered:

```typescript
// 1. React/libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Workspace packages
import { cn } from '@housing-platform/utils';
import { Button } from '@housing-platform/ui';

// 3. Shared code
import { supabase } from '@/shared/api/supabase';

// 4. Feature imports (relative within feature)
import { useBookingForm } from '../state';
import type { Booking } from '../model';
```

## Exports

- Features export public API via `index.ts`
- Internal code uses relative imports
- Never bypass barrel exports from other features

```typescript
// ✅ Correct
import { BookingPanel } from '@/features/booking';

// ❌ Incorrect — bypassing barrel
import { BookingPanel } from '@/features/booking/components/BookingPanel';
```

## TypeScript

- **Strict mode**: Enabled
- **No type suppression**: Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- **Props**: Define with `interface`, place directly above component
- **Zod**: Use for runtime validation, types in `@housing-platform/validation`

## Testing

### Location

```
Component.tsx           # Source
Component.test.tsx      # Colocated test (preferred)
__tests__/Component.ts  # Alternative for many tests
```

### Key Rules

- Mock external dependencies only
- Use `renderHook` for hook tests
- Test behavior, not implementation
- Use `data-testid` on forms and primary actions

### Fixtures

```typescript
// src/test/fixtures/property.ts
export function createPropertyDetail(overrides?: Partial<PropertyDetail>): PropertyDetail {
  return {
    id: 'prop-1',
    title: 'Test Property',
    ...overrides,
  };
}
```

## E2E (Playwright)

Critical flows in `tests/e2e/specs/`:

```bash
supabase start && pnpm db:reset   # seed dev accounts
pnpm test:e2e                     # runs Playwright
```

## Storybook

```bash
pnpm storybook           # packages/ui (port 6006)
pnpm storybook:features  # apps/web (port 6007)
```

Story naming: `Component.stories.tsx` colocated with component.

## Styling

- Tailwind for all styling
- CVA for component variants
- `cn()` for conditional classes

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('px-4 py-2 rounded', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
});
```

## i18n

Type-safe translations:

```typescript
import { useTypedTranslation } from '@/i18n/hooks';

const { t } = useTypedTranslation('auth');
t('login.title');     // ✓ autocomplete
t('login.invalid');   // ✗ compile error
```

Files: `src/i18n/locales/{en,ko}/*.json`
