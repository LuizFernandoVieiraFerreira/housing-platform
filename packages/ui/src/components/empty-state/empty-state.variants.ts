import { cva, type VariantProps } from 'class-variance-authority';

export const emptyStateVariants = cva('rounded-xl border border-dashed p-8 text-center', {
  variants: {
    variant: {
      default: 'border-surface-subtle text-ink-muted',
      error: 'border-status-error-border bg-status-error-bg text-status-error-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type EmptyStateVariant = NonNullable<VariantProps<typeof emptyStateVariants>['variant']>;
