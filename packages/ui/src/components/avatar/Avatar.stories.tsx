import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { getInitials } from './getInitials';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>{getInitials('Min-jun Kim')}</AvatarFallback>
    </Avatar>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/80?u=housing-platform" alt="Min-jun Kim" />
      <AvatarFallback>MK</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Muted: Story = {
  render: () => (
    <Avatar variant="muted">
      <AvatarFallback>?</AvatarFallback>
    </Avatar>
  ),
};

export const EmailFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>{getInitials(null, 'guest@example.com')}</AvatarFallback>
    </Avatar>
  ),
};
