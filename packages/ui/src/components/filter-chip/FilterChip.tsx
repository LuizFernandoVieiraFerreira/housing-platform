import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { filterChipVariants } from './filter-chip.variants';

export interface FilterChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof filterChipVariants> {}

export function FilterChip({ active, className, type = 'button', ...props }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active ?? false}
      className={cn(filterChipVariants({ active }), className)}
      {...props}
    />
  );
}
