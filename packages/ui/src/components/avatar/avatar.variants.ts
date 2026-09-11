import { cva, type VariantProps } from 'class-variance-authority';

export const avatarVariants = cva(
  'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-9 w-9 text-sm',
        lg: 'h-12 w-12 text-base',
      },
      variant: {
        brand: 'bg-brand-100 text-brand-700',
        muted: 'bg-surface-muted text-ink-muted',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'brand',
    },
  },
);

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>['size']>;
