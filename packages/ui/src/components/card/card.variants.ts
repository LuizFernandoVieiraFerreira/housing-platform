import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('border-surface-subtle border bg-white', {
  variants: {
    variant: {
      default: 'rounded-xl shadow-sm',
      elevated: 'rounded-xl shadow-card',
      interactive:
        'hover:shadow-card group overflow-hidden rounded-xl shadow-sm transition-shadow motion-reduce:transition-none',
      dashed: 'rounded-xl border-dashed',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6 sm:p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'lg',
  },
});

export type CardVariant = NonNullable<VariantProps<typeof cardVariants>['variant']>;
