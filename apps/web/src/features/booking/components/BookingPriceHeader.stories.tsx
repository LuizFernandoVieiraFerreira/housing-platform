import type { Meta, StoryObj } from '@storybook/react';

import { BookingPriceHeader } from './BookingPriceHeader';

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);

const meta: Meta<typeof BookingPriceHeader> = {
  title: 'Features/Booking/BookingPriceHeader',
  component: BookingPriceHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80 rounded-lg border p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    formatPrice,
  },
};

export default meta;
type Story = StoryObj<typeof BookingPriceHeader>;

export const Authenticated: Story = {
  args: {
    price: 650000,
    minStayNights: 30,
    bookingModeLabel: 'Instant book',
    variant: 'authenticated',
  },
};

export const Unauthenticated: Story = {
  args: {
    price: 450000,
    minStayNights: 30,
    bookingModeLabel: 'Request to book',
    variant: 'unauthenticated',
  },
};

export const LongStay: Story = {
  args: {
    price: 1200000,
    minStayNights: 90,
    bookingModeLabel: 'Instant book',
    variant: 'authenticated',
  },
};
