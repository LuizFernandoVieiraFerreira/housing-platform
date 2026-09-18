import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  fetchAmenities,
  fetchHostProperties,
} from '@/features/host/api/host-properties-api';

describe('host-properties-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  describe('fetchHostProperties', () => {
    it('maps property list rows', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'prop-1',
                  title: 'Mapo Studio',
                  slug: 'mapo-studio',
                  property_type: 'studio',
                  district: 'Mapo',
                  status: 'draft',
                  booking_mode: 'request',
                  monthly_price_min: 900_000,
                  updated_at: '2026-01-01T00:00:00.000Z',
                  rooms: [{ id: 'room-1' }],
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const properties = await fetchHostProperties();

      expect(properties).toHaveLength(1);
      expect(properties[0]).toMatchObject({
        id: 'prop-1',
        roomCount: 1,
      });
    });
  });

  describe('fetchAmenities', () => {
    it('maps amenity options', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'amenity-1', slug: 'wifi', name: 'Wi-Fi' }],
            error: null,
          }),
        }),
      });

      await expect(fetchAmenities()).resolves.toEqual([
        { id: 'amenity-1', slug: 'wifi', name: 'Wi-Fi' },
      ]);
    });
  });
});
