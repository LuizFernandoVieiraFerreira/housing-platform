/**
 * Search feature public API
 *
 * Usage:
 *   import { usePropertySearch, buildSearchParams, searchKeys } from '@/features/search';
 */

// Query keys (colocated with feature)
export { searchKeys } from './keys';

// Hooks
export { usePropertySearch } from './hooks/usePropertySearch';
export { usePropertyDetail } from './hooks/usePropertyDetail';

// Library utilities
export {
  buildSearchParams,
  buildAiSearchParams,
} from './lib/search-params';

// Model layer exports
export {
  // Types
  type AccommodationType,
  type PropertyDetail,
  type PropertyDetailAmenity,
  type PropertyDetailImage,
  type PropertyDetailRow,
  type PropertyDetailRoom,
  type PropertySearchFilters,
  type PropertySearchResult,
  type PropertySearchSort,
  type RoomStatus,
  type SearchPropertyCard,
  type SearchPropertyRow,
  // Constants
  ACCOMMODATION_TYPE_OPTIONS,
  DEFAULT_GUEST_COUNT,
  DEFAULT_SORT,
  MAP_SEARCH_GRID_COLUMNS,
  MAP_SEARCH_SKELETON_VISIBLE_ROWS,
  SEARCH_RESULTS_PAGE_SIZE,
  SEOUL_CENTER,
  SORT_OPTIONS,
  // Utils
  filtersToRpcPayload,
  getMapSearchSkeletonCount,
  // Schemas
  propertySearchFiltersSchema,
} from './model';

// Components
export { NaverPropertyMap } from './components/NaverPropertyMap';
