import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    children: 'Your profile was updated successfully.',
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Monthly stays require a minimum 30-day booking period.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Payment confirmed. Your booking is pending host approval.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'We could not process your payment. Please try again.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Your host application is still under review.',
  },
};

export const Empty: Story = {
  render: () => null,
  parameters: {
    docs: {
      description: {
        story: 'Alerts are not rendered when there is no message to show.',
      },
    },
  },
};
