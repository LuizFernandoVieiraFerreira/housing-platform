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

import { fetchFeaturedProperties, submitPropertyForReview } from '@/features/listings/api/properties-api';

describe('properties-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  describe('fetchFeaturedProperties', () => {
    it('maps valid rows and drops listings without price', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'prop-1',
            title: 'Mapo Studio',
            slug: 'mapo-studio',
            property_type: 'studio',
            district: 'Mapo',
            nearest_station_name: 'Mapo',
            monthly_price_min: 900_000,
            tags: ['furnished'],
            property_images: [
              {
                storage_path: 'https://cdn.example/cover.jpg',
                alt_text: 'Living room',
                is_cover: true,
                sort_order: 0,
              },
            ],
          },
          {
            id: 'prop-2',
            title: 'Unpriced listing',
            slug: 'unpriced',
            property_type: 'studio',
            district: 'Mapo',
            nearest_station_name: null,
            monthly_price_min: null,
            tags: [],
            property_images: [],
          },
        ],
        error: null,
      });

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      });

      const properties = await fetchFeaturedProperties();

      expect(properties).toHaveLength(1);
      expect(properties[0]).toMatchObject({
        id: 'prop-1',
        title: 'Mapo Studio',
        monthlyPriceMin: 900_000,
        coverImageUrl: 'https://cdn.example/cover.jpg',
      });
    });

    it('propagates supabase errors', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database unavailable' },
            }),
          }),
        }),
      });

      await expect(fetchFeaturedProperties()).rejects.toThrow('Database unavailable');
    });
  });

  describe('submitPropertyForReview', () => {
    it('calls submit_property_for_review rpc', async () => {
      rpcMock.mockResolvedValue({
        data: { id: 'prop-1', status: 'pending_review' },
        error: null,
      });

      await expect(submitPropertyForReview('prop-1')).resolves.toEqual({
        id: 'prop-1',
        status: 'pending_review',
      });

      expect(rpcMock).toHaveBeenCalledWith('submit_property_for_review', {
        p_property_id: 'prop-1',
      });
    });
  });
});
