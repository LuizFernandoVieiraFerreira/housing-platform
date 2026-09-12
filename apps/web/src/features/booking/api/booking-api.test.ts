import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

import { fetchBookingDetail, fetchMyBookings, quoteBooking } from '@/features/booking/api/booking-api';

describe('booking-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  describe('fetchMyBookings', () => {
    it('drops rows with incomplete relations', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'complete',
            status: 'pending_payment',
            booking_type: 'instant',
            check_in: '2026-01-01',
            check_out: '2026-01-31',
            guest_count: 1,
            hold_expires_at: null,
            created_at: '2026-01-01T00:00:00.000Z',
            properties: { title: 'Studio', district: 'Mapo' },
            rooms: { name: 'Room A' },
            booking_price_snapshots: { total_krw: 900_000 },
          },
          {
            id: 'incomplete',
            status: 'pending_payment',
            booking_type: 'instant',
            check_in: '2026-01-01',
            check_out: '2026-01-31',
            guest_count: 1,
            hold_expires_at: null,
            created_at: '2026-01-01T00:00:00.000Z',
            properties: null,
            rooms: { name: 'Room A' },
            booking_price_snapshots: { total_krw: 900_000 },
          },
        ],
        error: null,
      });

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      });

      const bookings = await fetchMyBookings();

      expect(bookings).toHaveLength(1);
      expect(bookings[0]?.id).toBe('complete');
      expect(bookings[0]?.propertyTitle).toBe('Studio');
    });

    it('propagates supabase errors', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database unavailable'),
          }),
        }),
      });

      await expect(fetchMyBookings()).rejects.toThrow('Database unavailable');
    });
  });

  describe('quoteBooking', () => {
    it('throws when RPC returns no quote row', async () => {
      rpcMock.mockResolvedValue({ data: [], error: null });

      await expect(
        quoteBooking({
          roomId: 'room-1',
          checkIn: '2026-01-01',
          checkOut: '2026-01-31',
          guestCount: 1,
        }),
      ).rejects.toThrow('Unable to quote this stay');
    });

    it('maps quote row fields to camelCase', async () => {
      rpcMock.mockResolvedValue({
        data: [
          {
            room_id: 'room-1',
            property_id: 'property-1',
            booking_mode: 'instant',
            nights: 30,
            rent_krw: 900_000,
            service_fee_krw: 90_000,
            total_krw: 990_000,
            pricing_version: 'v1',
          },
        ],
        error: null,
      });

      await expect(
        quoteBooking({
          roomId: 'room-1',
          checkIn: '2026-01-01',
          checkOut: '2026-01-31',
          guestCount: 1,
        }),
      ).resolves.toEqual({
        roomId: 'room-1',
        propertyId: 'property-1',
        bookingMode: 'instant',
        nights: 30,
        rentKrw: 900_000,
        serviceFeeKrw: 90_000,
        totalKrw: 990_000,
        pricingVersion: 'v1',
      });
    });
  });

  describe('fetchBookingDetail', () => {
    it('calculates service fee percent from snapshot', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'booking-1',
                status: 'pending_payment',
                booking_type: 'instant',
                check_in: '2026-01-01',
                check_out: '2026-01-31',
                guest_count: 1,
                hold_expires_at: null,
                created_at: '2026-01-01T00:00:00.000Z',
                customer_notes: null,
                property_id: 'property-1',
                room_id: 'room-1',
                properties: { title: 'Studio', district: 'Mapo' },
                rooms: { name: 'Room A' },
                booking_price_snapshots: {
                  rent_krw: 1_000_000,
                  service_fee_krw: 100_000,
                  total_krw: 1_100_000,
                  pricing_version: 'v1',
                },
              },
              error: null,
            }),
          }),
        }),
      });

      await expect(fetchBookingDetail('booking-1')).resolves.toMatchObject({
        id: 'booking-1',
        rentKrw: 1_000_000,
        serviceFeeKrw: 100_000,
        serviceFeePercent: 10,
      });
    });

    it('returns null when booking is missing', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      await expect(fetchBookingDetail('missing')).resolves.toBeNull();
    });
  });
});
