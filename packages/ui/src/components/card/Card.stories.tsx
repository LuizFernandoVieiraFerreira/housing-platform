import type { Meta, StoryObj } from '@storybook/react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';
import { Button } from '../button/Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Account overview</CardTitle>
        <CardDescription>Manage your profile, bookings, and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-ink-muted text-sm">Your next booking starts in 12 days.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">View bookings</Button>
      </CardFooter>
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card padding="md" className="w-64">
      <p className="text-ink text-lg font-semibold">Your account</p>
      <p className="text-ink-muted mt-1 text-sm">guest@example.com</p>
    </Card>
  ),
};

export const Dashed: Story = {
  render: () => (
    <Card variant="dashed" padding="lg" className="w-full max-w-md text-center">
      <p className="text-ink-muted text-sm">No bookings yet.</p>
    </Card>
  ),
};

export const Responsive: Story = {
  render: () => (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Responsive page panel</CardTitle>
        <CardDescription>Padding increases on larger breakpoints.</CardDescription>
      </CardHeader>
    </Card>
  ),
  parameters: {
    layout: 'padded',
  },
};
