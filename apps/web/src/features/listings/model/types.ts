/**
 * Listings feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for property types within the feature.
 */

// Re-export shared types from the types package
export type {
  AccommodationType,
  AmenityOption,
  BookingMode,
  FeaturedPropertyCard,
  Property,
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRoom,
  PropertyImage,
  PropertySearchFilters,
  PropertySearchResult,
  PropertySearchSort,
  PropertyStatus,
  Room,
  RoomStatus,
  SearchPropertyCard,
} from '@housing-platform/types';

// ============================================================================
// Feature-Local Types (Row types for Supabase queries)
// ============================================================================

/**
 * Image row type from Supabase property_images relation.
 */
export interface PropertyImageRow {
  storage_path: string;
  alt_text: string | null;
  is_cover: boolean;
  sort_order: number;
}

/**
 * Row type returned by Supabase for featured property queries.
 * Used internally by mappers.
 */
export interface FeaturedPropertyRow {
  id: string;
  title: string;
  slug: string;
  property_type: 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom';
  district: string;
  nearest_station_name: string | null;
  monthly_price_min: number | null;
  tags: string[] | null;
  property_images: PropertyImageRow[] | null;
}
