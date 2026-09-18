import { describe, expect, it } from 'vitest';

import {
  MAP_SEARCH_GRID_COLUMNS,
  MAP_SEARCH_SKELETON_VISIBLE_ROWS,
  SEARCH_RESULTS_PAGE_SIZE,
} from '@/features/search/model/constants';
import { filtersToRpcPayload, getMapSearchSkeletonCount } from '@/features/search/model/utils';

describe('search model utils', () => {
  it('builds rpc payload from filters', () => {
    expect(
      filtersToRpcPayload({
        query: 'mapo',
        propertyType: 'studio',
        checkIn: '2026-03-01',
        checkOut: '2026-04-01',
        guests: 1,
        priceMin: 500_000,
        priceMax: 1_000_000,
        amenitySlugs: ['wifi'],
      }),
    ).toMatchObject({
      query: 'mapo',
      property_type: 'studio',
      check_in: '2026-03-01',
      check_out: '2026-04-01',
      guests: 1,
      price_min: 500_000,
      price_max: 1_000_000,
      amenity_slugs: ['wifi'],
      sort: 'recommended',
    });
  });

  it('derives map skeleton count from page size and grid layout', () => {
    expect(getMapSearchSkeletonCount()).toBe(
      MAP_SEARCH_GRID_COLUMNS * MAP_SEARCH_SKELETON_VISIBLE_ROWS,
    );
    expect(getMapSearchSkeletonCount()).toBeLessThanOrEqual(SEARCH_RESULTS_PAGE_SIZE);
  });

  it('caps skeleton count at the requested page size', () => {
    expect(getMapSearchSkeletonCount(4)).toBe(4);
  });
});
