import { describe, expect, it } from 'vitest';

import {
  getMapSearchSkeletonCount,
  MAP_SEARCH_GRID_COLUMNS,
  MAP_SEARCH_SKELETON_VISIBLE_ROWS,
  SEARCH_RESULTS_PAGE_SIZE,
} from '@/features/search/lib/search-config';

describe('search-config', () => {
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
