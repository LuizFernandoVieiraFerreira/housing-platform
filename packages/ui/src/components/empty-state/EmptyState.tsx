import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@housing-platform/utils';
import { emptyStateVariants } from './empty-state.variants';

export interface EmptyStateProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyStateVariants> {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ variant }), className)} {...props}>
      {title ? <p className="text-ink text-sm font-medium">{title}</p> : null}
      {description ? <p className="mt-2 text-sm">{description}</p> : null}
      {children}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
