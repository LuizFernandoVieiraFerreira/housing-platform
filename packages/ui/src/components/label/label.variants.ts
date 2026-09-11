import { cva, type VariantProps } from 'class-variance-authority';

export const labelVariants = cva('text-ink block text-sm font-medium', {
  variants: {
    spacing: {
      default: 'mb-1.5',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
});

export type LabelSpacing = NonNullable<VariantProps<typeof labelVariants>['spacing']>;
