import { cva, type VariantProps } from 'class-variance-authority';

import { disabledStyles, focusRing } from '../../lib/variants';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
    focusRing(),
    disabledStyles,
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600',
        secondary: 'border border-surface-subtle bg-white text-ink hover:bg-surface-muted',
        ghost: 'text-ink hover:bg-surface-muted',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
