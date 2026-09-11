import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from './SelectIcons';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@housing-platform/utils';
import { disabledStyles, focusRing, formControlBase } from '../../lib/variants';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps extends ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> {
  hasError?: boolean;
}

export function SelectTrigger({
  className,
  hasError = false,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        formControlBase({ hasError }),
        'flex items-center justify-between gap-2 text-left',
        disabledStyles,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="text-ink-subtle h-4 w-4 shrink-0" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'border-surface-subtle z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-white shadow-lg',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'text-ink relative flex cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'data-[highlighted]:bg-surface-muted data-[highlighted]:text-ink',
        focusRing(),
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('text-ink-muted px-2 py-1.5 text-xs font-semibold', className)}
      {...props}
    />
  );
}

export function SelectSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn('bg-surface-subtle -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}
