import { cva, type VariantProps } from 'class-variance-authority';

import { focusRing } from '../../lib/variants';

export const filterChipVariants = cva(
  [
    'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
    focusRing(),
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      active: {
        true: 'border-brand-500 bg-brand-50 text-brand-700',
        false:
          'border-surface-subtle text-ink-muted hover:border-brand-200 hover:text-ink bg-white',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type FilterChipActive = NonNullable<VariantProps<typeof filterChipVariants>['active']>;
