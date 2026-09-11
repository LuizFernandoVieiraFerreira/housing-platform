import * as LabelPrimitive from '@radix-ui/react-label';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@housing-platform/utils';
import { labelVariants } from './label.variants';

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root>, VariantProps<typeof labelVariants> {
  required?: boolean;
}

export function Label({ className, spacing, required = false, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root className={cn(labelVariants({ spacing }), className)} {...props}>
      {children}
      {required ? <span className="text-brand-500"> *</span> : null}
    </LabelPrimitive.Root>
  );
}
