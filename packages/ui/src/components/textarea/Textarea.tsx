import type { VariantProps } from 'class-variance-authority';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { textareaVariants } from './textarea.variants';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, VariantProps<typeof textareaVariants> {}

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(textareaVariants({ hasError }), className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
