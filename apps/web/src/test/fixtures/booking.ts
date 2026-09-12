import type { BookingDetail } from '@housing-platform/types';

export function createBookingDetail(
  overrides: Partial<BookingDetail> = {},
): BookingDetail {
  return {
    id: 'booking-1',
    status: 'pending_payment',
    bookingType: 'instant',
    checkIn: '2026-01-01',
    checkOut: '2026-01-31',
    guestCount: 1,
    propertyTitle: 'Hongdae Studio',
    district: 'Mapo-gu',
    roomName: 'Room A',
    totalKrw: 1_100_000,
    holdExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
    customerNotes: null,
    rentKrw: 1_000_000,
    serviceFeeKrw: 100_000,
    serviceFeePercent: 10,
    pricingVersion: 'v1',
    propertyId: 'property-1',
    roomId: 'room-1',
    ...overrides,
  };
}
