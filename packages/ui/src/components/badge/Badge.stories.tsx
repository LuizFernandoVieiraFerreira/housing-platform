import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    children: 'Near subway',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Brand: Story = {
  args: {
    variant: 'brand',
  },
};

export const Eyebrow: Story = {
  args: {
    variant: 'eyebrow',
    children: 'Confirmed booking',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Approved',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Rejected',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Pending review',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="brand">Furnished</Badge>
      <Badge variant="eyebrow">Share-house</Badge>
      <Badge variant="outline">Studio</Badge>
      <Badge variant="success">Paid</Badge>
      <Badge variant="error">Failed</Badge>
      <Badge variant="warning">Pending</Badge>
    </div>
  ),
};
