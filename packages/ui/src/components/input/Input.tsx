import type { InputHTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { formControlBase } from '../../lib/variants';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(formControlBase({ hasError }), className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
