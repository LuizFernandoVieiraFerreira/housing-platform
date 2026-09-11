import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva('inline-flex items-center font-medium', {
  variants: {
    variant: {
      brand: 'bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 text-xs',
      eyebrow: 'text-brand-600 text-xs font-semibold uppercase tracking-wide',
      outline: 'border-surface-subtle text-ink-muted rounded-full border px-2.5 py-1 text-xs',
      success:
        'bg-status-success-bg text-status-success-foreground rounded-full px-2.5 py-1 text-xs',
      error: 'bg-status-error-bg text-status-error-foreground rounded-full px-2.5 py-1 text-xs',
      warning:
        'bg-status-warning-bg text-status-warning-foreground rounded-full px-2.5 py-1 text-xs',
    },
  },
  defaultVariants: {
    variant: 'brand',
  },
});

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
