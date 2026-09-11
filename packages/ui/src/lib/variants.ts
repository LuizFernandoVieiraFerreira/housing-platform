import { cva } from 'class-variance-authority';

export const focusRing = cva(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none',
  {
    variants: {
      intent: {
        brand: 'focus-visible:ring-brand-400',
        error: 'focus-visible:ring-red-400',
      },
    },
    defaultVariants: {
      intent: 'brand',
    },
  },
);

export const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

export const formControlBase = cva(
  [
    'border-surface-subtle text-ink w-full rounded-lg border bg-white text-sm outline-none transition-colors',
    'placeholder:text-ink-subtle',
    focusRing(),
  ],
  {
    variants: {
      size: {
        md: 'h-11 px-4',
        sm: 'h-9 px-3',
      },
      hasError: {
        true: 'border-red-500 focus-visible:ring-red-400',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
    },
  },
);
