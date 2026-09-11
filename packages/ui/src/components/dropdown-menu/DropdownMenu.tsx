import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';

import { cn } from '@housing-platform/utils';
import { focusRing } from '../../lib/variants';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'border-surface-subtle z-50 min-w-48 rounded-xl border bg-white py-2 shadow-lg',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('text-ink px-4 py-2 text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  inset,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'text-ink relative flex cursor-default select-none items-center px-4 py-2 text-sm outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'data-[highlighted]:bg-surface-muted data-[highlighted]:text-ink',
        focusRing(),
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('bg-surface-subtle -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

export function DropdownMenuHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-surface-subtle border-b px-4 py-3', className)} {...props} />;
}

export function DropdownMenuFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-surface-subtle border-t px-4 py-2', className)} {...props} />;
}
