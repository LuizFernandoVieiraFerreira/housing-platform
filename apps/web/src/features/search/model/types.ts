/**
 * Search feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for search types within the feature.
 */

import type { AiPropertySearchResponse, SearchPropertyCard } from '@housing-platform/types';

// Re-export shared types from the types package
export type {
  AccommodationType,
  AiPropertySearchResponse,
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRoom,
  PropertySearchFilters,
  PropertySearchResult,
  PropertySearchSort,
  RoomStatus,
  SearchPropertyCard,
} from '@housing-platform/types';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * Row type returned by Supabase for property search results.
 * Used internally by mappers.
 */
export interface SearchPropertyRow {
  id: string;
  title: string;
  slug: string;
  property_type: 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom';
  district: string;
  nearest_station_name: string | null;
  monthly_price_min: number;
  tags: string[] | null;
  cover_storage_path: string | null;
  cover_alt_text: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number | null;
  total_count: number;
}

/**
 * Row type returned by Supabase for property detail queries.
 * Used internally by mappers.
 */
export interface PropertyDetailRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  property_type: 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom';
  district: string;
  nearest_station_name: string | null;
  nearest_station_walk_min: number | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  booking_mode: 'instant' | 'request';
  min_stay_nights: number;
  monthly_price_min: number | null;
  tags: string[] | null;
  hosts: { display_name: string } | { display_name: string }[] | null;
  property_images: Array<{
    id: string;
    storage_path: string;
    alt_text: string | null;
    sort_order: number;
    is_cover: boolean;
  }> | null;
  rooms: Array<{
    id: string;
    name: string;
    room_type: string | null;
    size_sqm: number | null;
    max_occupancy: number;
    monthly_price_krw: number;
    status: 'available' | 'unavailable' | 'archived';
    available_from: string | null;
  }> | null;
  property_amenities: Array<{
    amenities: {
      id: string;
      slug: string;
      name: string;
      icon: string | null;
      sort_order: number;
    } | null;
  }> | null;
}

/**
 * Row type returned by Supabase for property coordinates.
 */
export interface PropertyCoordinatesRow {
  latitude: number;
  longitude: number;
}

/**
 * Row type returned by the AI property search Edge Function.
 */
export interface AiSearchPropertyRow {
  id: string;
  title: string;
  slug: string;
  propertyType: SearchPropertyCard['propertyType'];
  district: string;
  nearestStationName: string | null;
  monthlyPriceMin: number;
  tags: string[] | null;
  coverImageUrl: string | null;
  coverImageStoragePath?: string | null;
  coverImageAlt: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
}

/**
 * Response payload from the AI property search Edge Function.
 */
export interface AiSearchFunctionResponse {
  items: AiSearchPropertyRow[];
  totalCount: number;
  interpretedFilters: AiPropertySearchResponse['interpretedFilters'];
  explanation?: string;
  fallbackUsed?: boolean;
}
