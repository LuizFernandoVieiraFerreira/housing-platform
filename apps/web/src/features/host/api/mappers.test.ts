import { describe, expect, it } from 'vitest';

import {
  mapBookingRow,
  mapBookingRows,
  mapHostRow,
  mapPropertyListRow,
  toCreateHostPropertyPayload,
  toHostPropertyPayload,
  toHostRoomInsertPayload,
  toPropertyAmenityRows,
} from '@/features/host/api/mappers';

describe('host mappers', () => {
  describe('mapHostRow', () => {
    it('maps host profile fields', () => {
      const result = mapHostRow({
        id: 'host-1',
        profile_id: 'user-1',
        display_name: 'Seoul Stays',
        status: 'active',
        verified_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      expect(result.display_name).toBe('Seoul Stays');
      expect(result.status).toBe('active');
    });
  });

  describe('mapPropertyListRow', () => {
    it('counts related rooms', () => {
      const result = mapPropertyListRow({
        id: 'prop-1',
        title: 'Mapo Studio',
        slug: 'mapo-studio',
        property_type: 'studio',
        district: 'Mapo',
        status: 'draft',
        booking_mode: 'request',
        monthly_price_min: 900_000,
        updated_at: '2026-01-01T00:00:00.000Z',
        rooms: [{ id: 'room-1' }, { id: 'room-2' }],
      });

      expect(result.roomCount).toBe(2);
    });
  });

  describe('request payloads', () => {
    it('builds create property payload with draft status', () => {
      const result = toCreateHostPropertyPayload(
        {
          title: 'Mapo Studio',
          description: 'Bright studio near the subway.',
          propertyType: 'studio',
          addressLine1: '123 Mapo-ro',
          addressLine2: '',
          city: 'Seoul',
          postalCode: '',
          district: 'Mapo',
          nearestStationName: 'Mapo',
          nearestStationWalkMin: 5,
          bookingMode: 'instant',
          minStayNights: 30,
          tags: 'quiet, furnished , ',
          amenityIds: [],
        },
        'host-1',
        'mapo-studio',
      );

      expect(result).toMatchObject({
        host_id: 'host-1',
        slug: 'mapo-studio',
        status: 'draft',
        tags: ['quiet', 'furnished'],
      });
    });

    it('normalizes optional room fields for insert', () => {
      const result = toHostRoomInsertPayload('prop-1', {
        name: 'Room A',
        roomType: '',
        sizeSqm: '',
        maxOccupancy: 1,
        monthlyPriceKrw: 900_000,
        availableFrom: '',
      });

      expect(result).toMatchObject({
        property_id: 'prop-1',
        room_type: null,
        size_sqm: null,
        available_from: null,
        status: 'available',
      });
    });

    it('maps amenity ids to join rows', () => {
      expect(toPropertyAmenityRows('prop-1', ['wifi', 'desk'])).toEqual([
        { property_id: 'prop-1', amenity_id: 'wifi' },
        { property_id: 'prop-1', amenity_id: 'desk' },
      ]);
    });

    it('preserves update payload without host metadata', () => {
      const result = toHostPropertyPayload({
        title: 'Updated title',
        description: 'Updated description',
        propertyType: 'studio',
        addressLine1: '123 Mapo-ro',
        addressLine2: '',
        city: 'Seoul',
        postalCode: '',
        district: 'Mapo',
        nearestStationName: '',
        nearestStationWalkMin: '',
        bookingMode: 'request',
        minStayNights: 30,
        tags: '',
        amenityIds: [],
      });

      expect(result).not.toHaveProperty('host_id');
      expect(result).not.toHaveProperty('status');
    });
  });

  describe('mapBookingRow', () => {
    it('filters incomplete booking rows', () => {
      const rows = mapBookingRows([
        {
          id: 'complete',
          status: 'confirmed',
          booking_type: 'instant',
          check_in: '2026-02-01',
          check_out: '2026-03-01',
          guest_count: 1,
          customer_notes: null,
          created_at: '2026-01-01T00:00:00.000Z',
          properties: { title: 'Mapo Studio' },
          rooms: { name: 'Room A' },
          booking_price_snapshots: { total_krw: 900_000 },
        },
        {
          id: 'incomplete',
          status: 'confirmed',
          booking_type: 'instant',
          check_in: '2026-02-01',
          check_out: '2026-03-01',
          guest_count: 1,
          customer_notes: null,
          created_at: '2026-01-01T00:00:00.000Z',
          properties: null,
          rooms: { name: 'Room A' },
          booking_price_snapshots: { total_krw: 900_000 },
        },
      ]);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.id).toBe('complete');
      expect(mapBookingRow({
        id: 'incomplete',
        status: 'confirmed',
        booking_type: 'instant',
        check_in: '2026-02-01',
        check_out: '2026-03-01',
        guest_count: 1,
        customer_notes: null,
        created_at: '2026-01-01T00:00:00.000Z',
        properties: null,
        rooms: { name: 'Room A' },
        booking_price_snapshots: { total_krw: 900_000 },
      })).toBeNull();
    });
  });
});
