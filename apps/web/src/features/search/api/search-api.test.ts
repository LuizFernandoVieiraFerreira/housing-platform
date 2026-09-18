import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example/image.jpg' } }),
      }),
    },
  },
}));

import { searchProperties } from '@/features/search/api/search-api';

describe('search-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  describe('searchProperties', () => {
    it('maps rpc rows and total count', async () => {
      rpcMock.mockResolvedValue({
        data: [
          {
            id: 'prop-1',
            title: 'Mapo Studio',
            slug: 'mapo-studio',
            property_type: 'studio',
            district: 'Mapo',
            nearest_station_name: 'Mapo',
            monthly_price_min: 900_000,
            tags: ['quiet'],
            cover_storage_path: 'https://cdn.example/cover.jpg',
            cover_alt_text: 'Cover',
            latitude: 37.55,
            longitude: 126.91,
            distance_meters: 500,
            total_count: 12,
          },
        ],
        error: null,
      });

      const result = await searchProperties({ query: 'mapo' });

      expect(result.totalCount).toBe(12);
      expect(result.items[0]).toMatchObject({
        id: 'prop-1',
        district: 'Mapo',
        monthlyPriceMin: 900_000,
      });
    });

    it('propagates rpc errors', async () => {
      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'Search unavailable' },
      });

      await expect(searchProperties({ query: 'mapo' })).rejects.toThrow('Search unavailable');
    });
  });
});
