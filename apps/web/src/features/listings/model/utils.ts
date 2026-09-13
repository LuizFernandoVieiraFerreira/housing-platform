/**
 * Pure utility functions for listings domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { PropertyImageRow, PropertyStatus, FeaturedPropertyCard } from './types';
import { PUBLIC_STATUSES, DRAFT_STATUSES } from './constants';

// ============================================================================
// Status Checks
// ============================================================================

/**
 * Check if a property is publicly visible.
 */
export function isPublicProperty(status: PropertyStatus): boolean {
  return PUBLIC_STATUSES.includes(status);
}

/**
 * Check if a property is in draft state.
 */
export function isDraftProperty(status: PropertyStatus): boolean {
  return DRAFT_STATUSES.includes(status);
}

// ============================================================================
// Image Utilities
// ============================================================================

/**
 * Find the cover image from a list of property images.
 * Falls back to the first image by sort order if no explicit cover.
 */
export function findCoverImage(images: PropertyImageRow[] | null): PropertyImageRow | null {
  if (!images || images.length === 0) {
    return null;
  }

  const coverImage = images.find((image) => image.is_cover);
  if (coverImage) {
    return coverImage;
  }

  // Fall back to first image by sort order
  return [...images].sort((left, right) => left.sort_order - right.sort_order)[0] ?? null;
}

/**
 * Check if a storage path is already an absolute URL.
 */
export function isAbsoluteUrl(storagePath: string): boolean {
  return /^https?:\/\//i.test(storagePath);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a property has a valid monthly price for display.
 */
export function hasValidPrice(monthlyPriceMin: number | null): monthlyPriceMin is number {
  return monthlyPriceMin != null && monthlyPriceMin > 0;
}

/**
 * Check if a featured property card has all required fields.
 */
export function isValidFeaturedProperty(
  property: Partial<FeaturedPropertyCard>,
): property is FeaturedPropertyCard {
  return (
    typeof property.id === 'string' &&
    typeof property.title === 'string' &&
    typeof property.slug === 'string' &&
    typeof property.propertyType === 'string' &&
    typeof property.district === 'string' &&
    typeof property.monthlyPriceMin === 'number'
  );
}
