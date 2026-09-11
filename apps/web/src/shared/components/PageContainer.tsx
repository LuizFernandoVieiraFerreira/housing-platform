import { cn } from '@housing-platform/utils';
import type { HTMLAttributes } from 'react';

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('max-w-content mx-auto w-full', className)} {...props} />;
}
