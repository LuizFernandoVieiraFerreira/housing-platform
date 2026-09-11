import { cva, type VariantProps } from 'class-variance-authority';

import { focusRing } from '../../lib/variants';

export const textareaVariants = cva(
  [
    'border-surface-subtle text-ink min-h-24 w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none transition-colors',
    'placeholder:text-ink-subtle',
    focusRing(),
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      hasError: {
        true: 'border-red-500 focus-visible:ring-red-400',
        false: '',
      },
    },
    defaultVariants: {
      hasError: false,
    },
  },
);

export type TextareaHasError = NonNullable<VariantProps<typeof textareaVariants>['hasError']>;
