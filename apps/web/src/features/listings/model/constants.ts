/**
 * Listings feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { PropertyStatus, PropertySearchSort } from './types';

// ============================================================================
// Status Groups
// ============================================================================

/**
 * Property statuses that are publicly visible.
 */
export const PUBLIC_STATUSES: readonly PropertyStatus[] = ['published'] as const;

/**
 * Property statuses that are in draft state.
 */
export const DRAFT_STATUSES: readonly PropertyStatus[] = ['draft', 'pending_review'] as const;

// ============================================================================
// Display Limits
// ============================================================================

/**
 * Maximum number of featured properties to display on homepage.
 */
export const MAX_FEATURED_PROPERTIES = 8;

/**
 * Default page size for property listings.
 */
export const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Search Defaults
// ============================================================================

/**
 * Default sort order for property searches.
 */
export const DEFAULT_SEARCH_SORT: PropertySearchSort = 'recommended';

/**
 * Available sort options with display metadata.
 */
export const LISTING_SORT_OPTIONS: Record<PropertySearchSort, { key: PropertySearchSort }> = {
  recommended: { key: 'recommended' },
  price_asc: { key: 'price_asc' },
  price_desc: { key: 'price_desc' },
  distance: { key: 'distance' },
  semantic: { key: 'semantic' },
} as const;

// ============================================================================
// Storage Buckets
// ============================================================================

/**
 * Supabase storage bucket for property images.
 */
export const PROPERTY_IMAGES_BUCKET = 'property-images';

/**
 * Supabase storage bucket for room images.
 */
export const ROOM_IMAGES_BUCKET = 'room-images';
