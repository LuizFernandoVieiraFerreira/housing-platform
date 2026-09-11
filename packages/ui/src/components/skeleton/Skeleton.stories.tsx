import type { Meta, StoryObj } from '@storybook/react';

import { PropertyCardSkeleton, Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    className: 'w-48',
  },
};

export const Title: Story = {
  args: {
    variant: 'title',
    className: 'w-64',
  },
};

export const Avatar: Story = {
  args: {
    variant: 'avatar',
    className: 'h-9 w-9',
  },
};

export const LoadingCard: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <PropertyCardSkeleton />
      <PropertyCardSkeleton />
      <PropertyCardSkeleton />
      <PropertyCardSkeleton />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const LoadingList: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-3">
      <Skeleton variant="title" className="w-3/4" />
      <Skeleton className="w-full" />
      <Skeleton className="w-5/6" />
    </div>
  ),
};
