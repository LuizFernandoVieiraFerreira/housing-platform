# Conventions

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `booking-api.ts` |
| Components | PascalCase | `BookingPanel.tsx` |
| Hooks | camelCase, `use` prefix | `useBookingPanel.ts` |
| Constants | SCREAMING_SNAKE | `MAX_GUEST_COUNT` |
| Types | PascalCase | `BookingStatus` |
| Folders | kebab-case | `my-feature/` |

## Imports

Grouped and ordered:
```typescript
// 1. React/libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Workspace packages
import { cn } from '@housing/utils';
import { Button } from '@housing/ui';

// 3. Shared code
import { supabase } from '@/shared/lib/supabase';

// 4. Feature imports (relative)
import { useBookingForm } from '../state';
import type { Booking } from '../model';
```

## Exports

- Features export public API via `index.ts`
- Internal code uses relative imports
- Never bypass barrel exports from other features

```typescript
// ✅ Good
import { BookingPanel } from '@/features/booking';

// ❌ Bad - bypassing barrel
import { BookingPanel } from '@/features/booking/components/BookingPanel';
```

## Testing

```
__tests__/           # Unit tests (if many)
Component.test.tsx   # Colocated tests (if few)
```

Key rules:
- Mock external dependencies only
- Use `renderHook` for hook tests
- Test behavior, not implementation

## Storybook

Two Storybook instances:

```bash
pnpm storybook           # UI components (packages/ui, port 6006)
pnpm storybook:features  # Feature components (apps/web, port 6007)
```

Story file naming:
```
Component.stories.tsx    # Colocated with component
```

Feature stories include providers (QueryClient, i18n, Router) automatically.

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

Type-safe translations with autocomplete:

```typescript
// Standard hook (existing code)
const { t } = useTranslation('booking');
t('status.confirmed'); // works

// Typed hook (new - provides autocomplete)
import { useTypedTranslation } from '@/i18n/hooks';

const { t } = useTypedTranslation('auth');
t('login.title');     // ✓ autocomplete
t('login.invalid');   // ✗ compile error

// Files
i18n/
├── types.ts          # Type definitions
├── hooks.ts          # useTypedTranslation, useTranslation
├── locales/
│   ├── en/*.json
│   └── ko/*.json
└── i18next.d.ts      # i18next type augmentation
```
