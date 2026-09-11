export const SEARCH_RESULTS_PAGE_SIZE = 20;

export const MAP_SEARCH_GRID_COLUMNS = 2;

export const MAP_SEARCH_SKELETON_VISIBLE_ROWS = 3;

export function getMapSearchSkeletonCount(pageSize: number = SEARCH_RESULTS_PAGE_SIZE): number {
  return Math.min(pageSize, MAP_SEARCH_GRID_COLUMNS * MAP_SEARCH_SKELETON_VISIBLE_ROWS);
}
