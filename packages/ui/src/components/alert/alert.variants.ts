import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva('rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-surface-subtle bg-surface-muted text-ink',
      success: 'border-status-success-border bg-status-success-bg text-status-success-foreground',
      error: 'border-status-error-border bg-status-error-bg text-status-error-foreground',
      warning: 'border-status-warning-border bg-status-warning-bg text-status-warning-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;
