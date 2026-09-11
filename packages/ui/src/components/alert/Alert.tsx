import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { alertVariants } from './alert.variants';

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ variant, className, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
