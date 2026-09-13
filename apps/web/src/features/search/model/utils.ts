/**
 * Pure utility functions for search domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { PropertySearchFilters } from './types';
import {
  MAP_SEARCH_GRID_COLUMNS,
  MAP_SEARCH_SKELETON_VISIBLE_ROWS,
  SEARCH_RESULTS_PAGE_SIZE,
} from './constants';

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Calculate the number of skeleton cards to display during loading.
 */
export function getMapSearchSkeletonCount(
  pageSize: number = SEARCH_RESULTS_PAGE_SIZE,
): number {
  return Math.min(pageSize, MAP_SEARCH_GRID_COLUMNS * MAP_SEARCH_SKELETON_VISIBLE_ROWS);
}

// ============================================================================
// RPC Payload Transformation
// ============================================================================

/**
 * Transform PropertySearchFilters to Supabase RPC payload format.
 * Converts camelCase to snake_case and filters out undefined values.
 */
export function filtersToRpcPayload(filters: PropertySearchFilters): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sort: filters.sort ?? 'recommended',
  };

  if (filters.query) {
    payload.query = filters.query;
  }

  if (filters.propertyType) {
    payload.property_type = filters.propertyType;
  }

  if (filters.checkIn) {
    payload.check_in = filters.checkIn;
  }

  if (filters.checkOut) {
    payload.check_out = filters.checkOut;
  }

  if (filters.guests != null) {
    payload.guests = filters.guests;
  }

  if (filters.priceMin != null) {
    payload.price_min = filters.priceMin;
  }

  if (filters.priceMax != null) {
    payload.price_max = filters.priceMax;
  }

  if (filters.centerLat != null) {
    payload.center_lat = filters.centerLat;
  }

  if (filters.centerLng != null) {
    payload.center_lng = filters.centerLng;
  }

  if (
    filters.north != null &&
    filters.south != null &&
    filters.east != null &&
    filters.west != null
  ) {
    payload.north = filters.north;
    payload.south = filters.south;
    payload.east = filters.east;
    payload.west = filters.west;
  }

  if (filters.amenitySlugs?.length) {
    payload.amenity_slugs = filters.amenitySlugs;
  }

  if (filters.maxStationWalkMin != null) {
    payload.max_station_walk_min = filters.maxStationWalkMin;
  }

  if (filters.excludePropertyIds?.length) {
    payload.exclude_property_ids = filters.excludePropertyIds;
  }

  return payload;
}
