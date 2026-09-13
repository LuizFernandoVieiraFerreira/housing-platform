/**
 * Listings feature public API
 *
 * Layer structure:
 * - model/     Pure domain: types, constants, pure utils
 * - api/       Data fetching, mappers
 * - lib/       Utilities with external dependencies (supabase)
 * - pages/     Page components
 *
 * Usage:
 *   import { PropertyDetailPage, listingsKeys } from '@/features/listings';
 */

// ============================================================================
// Model Layer (Pure Domain)
// ============================================================================

// Types
export type {
  AccommodationType,
  AmenityOption,
  BookingMode,
  FeaturedPropertyCard,
  FeaturedPropertyRow,
  Property,
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRoom,
  PropertyImage,
  PropertyImageRow,
  PropertySearchFilters,
  PropertySearchResult,
  PropertySearchSort,
  PropertyStatus,
  Room,
  RoomStatus,
  SearchPropertyCard,
} from './model';

// Constants
export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_SORT,
  DRAFT_STATUSES,
  LISTING_SORT_OPTIONS,
  MAX_FEATURED_PROPERTIES,
  PROPERTY_IMAGES_BUCKET,
  PUBLIC_STATUSES,
  ROOM_IMAGES_BUCKET,
} from './model';

// Pure Utils
export {
  findCoverImage,
  hasValidPrice,
  isAbsoluteUrl,
  isDraftProperty,
  isPublicProperty,
  isValidFeaturedProperty,
} from './model';

// ============================================================================
// API Layer
// ============================================================================

export { listingsKeys } from './keys';

// API functions
export { fetchFeaturedProperties, submitPropertyForReview } from './api/properties-api';

// Mappers (for advanced use cases)
export { mapFeaturedPropertyRow } from './api/mappers';

// ============================================================================
// Utilities (with external dependencies)
// ============================================================================

export { resolvePropertyImageUrl, resolveRoomImageUrl } from './lib/image-url';

// ============================================================================
// Pages
// ============================================================================

export { PropertyDetailPage } from './pages/PropertyDetailPage';
