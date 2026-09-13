/**
 * Search feature constants.
 *
 * Business rules, configuration values, and defaults.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { AccommodationType, PropertySearchSort } from './types';

// ============================================================================
// Map Configuration
// ============================================================================

/**
 * Default map center coordinates (Seoul City Hall area).
 */
export const SEOUL_CENTER = {
  centerLat: 37.5665,
  centerLng: 126.978,
} as const;

// ============================================================================
// Search Configuration
// ============================================================================

/**
 * Default page size for search results.
 */
export const SEARCH_RESULTS_PAGE_SIZE = 20;

/**
 * Number of columns in the map search grid layout.
 */
export const MAP_SEARCH_GRID_COLUMNS = 2;

/**
 * Number of visible rows for skeleton loading state.
 */
export const MAP_SEARCH_SKELETON_VISIBLE_ROWS = 3;

// ============================================================================
// Filter Options
// ============================================================================

/**
 * Accommodation type filter options.
 */
export const ACCOMMODATION_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'share-house', label: 'Share-house' },
  { value: 'studio', label: 'Studio' },
  { value: 'micro-studio', label: 'Micro Studio' },
  { value: 'multi-bedroom', label: 'Multi-bedroom' },
] as const satisfies ReadonlyArray<{ value: AccommodationType | ''; label: string }>;

/**
 * Sort options for search results.
 */
export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'distance', label: 'Distance' },
] as const satisfies ReadonlyArray<{ value: PropertySearchSort; label: string }>;

// ============================================================================
// Search Defaults
// ============================================================================

/**
 * Default guest count for searches.
 */
export const DEFAULT_GUEST_COUNT = 1;

/**
 * Default sort order for searches.
 */
export const DEFAULT_SORT: PropertySearchSort = 'recommended';
