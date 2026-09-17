import type { Meta, StoryObj } from '@storybook/react';

import { BookingQuoteSummary } from './BookingQuoteSummary';

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);

const baseQuote = {
  roomId: 'room-1',
  propertyId: 'prop-1',
  bookingMode: 'instant' as const,
  pricingVersion: '2024-01',
};

const meta: Meta<typeof BookingQuoteSummary> = {
  title: 'Features/Booking/BookingQuoteSummary',
  component: BookingQuoteSummary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    formatPrice,
  },
};

export default meta;
type Story = StoryObj<typeof BookingQuoteSummary>;

export const OneMonth: Story = {
  args: {
    quote: {
      ...baseQuote,
      rentKrw: 650000,
      serviceFeeKrw: 65000,
      totalKrw: 715000,
      nights: 30,
    },
  },
};

export const ThreeMonths: Story = {
  args: {
    quote: {
      ...baseQuote,
      rentKrw: 1950000,
      serviceFeeKrw: 195000,
      totalKrw: 2145000,
      nights: 90,
    },
  },
};

export const SingleNight: Story = {
  args: {
    quote: {
      ...baseQuote,
      rentKrw: 21667,
      serviceFeeKrw: 2167,
      totalKrw: 23834,
      nights: 1,
    },
  },
};
