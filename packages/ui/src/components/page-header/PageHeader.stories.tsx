import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button/Button';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Your bookings',
    description: 'View upcoming and past monthly stays.',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEyebrow: Story = {
  args: {
    eyebrow: 'Checkout',
    title: 'Complete your booking',
    description: 'Review details before payment.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Host properties',
    description: 'Manage listings and availability.',
    actions: <Button size="sm">Add property</Button>,
  },
};

export const SectionTitle: Story = {
  args: {
    headingLevel: 'h2',
    title: 'Featured stays',
    description: 'Hand-picked monthly rentals near universities and transit hubs.',
  },
};

export const Responsive: Story = {
  render: () => (
    <PageHeader
      title="Admin dashboard"
      description="Monitor bookings, payments, and host applications."
      actions={
        <>
          <Button variant="secondary" size="sm">
            Export
          </Button>
          <Button size="sm">Review queue</Button>
        </>
      }
      className="w-full max-w-6xl px-4"
    />
  ),
  parameters: {
    layout: 'padded',
  },
};
