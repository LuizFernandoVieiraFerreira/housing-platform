import { cva, type VariantProps } from 'class-variance-authority';

export const skeletonVariants = cva(
  'bg-surface-muted animate-pulse rounded motion-reduce:animate-none',
  {
    variants: {
      variant: {
        text: 'h-4',
        title: 'h-6',
        avatar: 'rounded-full',
        block: '',
        card: 'border-surface-subtle overflow-hidden rounded-xl border bg-white shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'text',
    },
  },
);

export type SkeletonVariant = NonNullable<VariantProps<typeof skeletonVariants>['variant']>;
