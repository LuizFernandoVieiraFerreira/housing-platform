import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback } from '../avatar/Avatar';
import { getInitials } from '../avatar/getInitials';
import { Button } from '../button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full focus-visible:outline-none"
        >
          <Avatar>
            <AvatarFallback>{getInitials('Min-jun Kim', 'guest@example.com')}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuHeader>
          <p className="text-ink text-sm font-semibold">Min-jun Kim</p>
          <p className="text-ink-muted truncate text-xs">guest@example.com</p>
        </DropdownMenuHeader>
        <DropdownMenuItem>Account</DropdownMenuItem>
        <DropdownMenuItem>Bookings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuFooter>
          <Button variant="ghost" size="sm" className="w-full justify-start px-0">
            Sign out
          </Button>
        </DropdownMenuFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit listing</DropdownMenuItem>
        <DropdownMenuItem disabled>Archive (unavailable)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
