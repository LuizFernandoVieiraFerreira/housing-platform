/**
 * Search model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
 * - Schemas (Zod validation)
 * - Constants (business rules, configuration)
 * - Utils (pure functions, no React/i18n dependencies)
 *
 * Rules:
 * - No React imports
 * - No i18n dependencies
 * - No external API calls
 * - Fully testable without mocking
 */

// Types
export type {
  AccommodationType,
  AiPropertySearchResponse,
  PropertyCoordinatesRow,
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRow,
  PropertyDetailRoom,
  PropertySearchFilters,
  PropertySearchResult,
  PropertySearchSort,
  RoomStatus,
  SearchPropertyCard,
  SearchPropertyRow,
  AiSearchPropertyRow,
  AiSearchFunctionResponse,
} from './types';

// Schemas
export {
  aiPropertySearchRequestSchema,
  propertySearchFiltersSchema,
} from './schemas';

// Constants
export {
  ACCOMMODATION_TYPE_OPTIONS,
  DEFAULT_GUEST_COUNT,
  DEFAULT_SORT,
  MAP_SEARCH_GRID_COLUMNS,
  MAP_SEARCH_SKELETON_VISIBLE_ROWS,
  SEARCH_RESULTS_PAGE_SIZE,
  SEOUL_CENTER,
  SORT_OPTIONS,
} from './constants';

// Utils
export {
  filtersToRpcPayload,
  getMapSearchSkeletonCount,
} from './utils';
