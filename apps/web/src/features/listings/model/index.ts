/**
 * Listings model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
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
} from './types';

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
} from './constants';

// Utils
export {
  findCoverImage,
  hasValidPrice,
  isAbsoluteUrl,
  isDraftProperty,
  isPublicProperty,
  isValidFeaturedProperty,
} from './utils';
