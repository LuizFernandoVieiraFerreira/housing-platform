import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No bookings yet',
    description: 'When you book a stay, it will appear here.',
    className: 'w-full max-w-md',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No properties listed',
    description: 'Create your first listing to start hosting.',
    action: <Button size="sm">Add property</Button>,
    className: 'w-full max-w-md',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    description: 'We could not load featured listings right now.',
    className: 'w-full max-w-md',
  },
};

export const Empty: Story = {
  args: {
    className: 'w-full max-w-md',
    children: <p className="text-sm">Nothing to show.</p>,
  },
};
