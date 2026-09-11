import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { skeletonVariants } from './skeleton.variants';

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ variant, className, ...props }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn(skeletonVariants({ variant }), className)} {...props} />
  );
}

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'border-surface-subtle animate-pulse overflow-hidden rounded-xl border bg-white shadow-sm motion-reduce:animate-none',
        className,
      )}
    >
      <div className="bg-surface-muted aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="title" className="w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
