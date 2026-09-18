import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example/image.jpg' } }),
      }),
    },
  },
}));

import { aiPropertySearch } from '@/features/search/api/ai-search-api';

describe('ai-search-api', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('maps successful ai search response', async () => {
    invokeMock.mockResolvedValue({
      data: {
        items: [
          {
            id: 'prop-1',
            title: 'Mapo Studio',
            slug: 'mapo-studio',
            propertyType: 'studio',
            district: 'Mapo',
            nearestStationName: 'Mapo',
            monthlyPriceMin: 900_000,
            tags: [],
            coverImageUrl: null,
            coverImageAlt: null,
            latitude: 37.55,
            longitude: 126.91,
            distanceMeters: null,
          },
        ],
        totalCount: 1,
        interpretedFilters: { district: 'Mapo' },
      },
      error: null,
    });

    const result = await aiPropertySearch({ query: 'quiet studio near mapo' });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.interpretedFilters).toEqual({ district: 'Mapo' });
  });

  it('throws inline api errors from response body', async () => {
    invokeMock.mockResolvedValue({
      data: { error: { message: 'Smart search is unavailable.' } },
      error: null,
    });

    await expect(aiPropertySearch({ query: 'mapo' })).rejects.toThrow(
      'Smart search is unavailable.',
    );
  });
});
