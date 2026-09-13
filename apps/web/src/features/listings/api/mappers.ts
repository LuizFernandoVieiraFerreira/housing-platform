/**
 * Data transformation functions for listings API responses.
 *
 * Mappers convert between:
 * - API/Supabase row format (snake_case)
 * - Domain model format (camelCase)
 *
 * This centralizes all data transformation logic for easier testing
 * and maintenance.
 */

import type {
  FeaturedPropertyCard,
  FeaturedPropertyRow,
} from '../model';
import { findCoverImage, hasValidPrice } from '../model';
import { resolvePropertyImageUrl } from '../lib/image-url';

// ============================================================================
// Response → Domain Mappers
// ============================================================================

/**
 * Map featured property row to domain model.
 * Returns null if the property is missing required data (e.g., no price).
 */
export function mapFeaturedPropertyRow(row: FeaturedPropertyRow): FeaturedPropertyCard | null {
  if (!hasValidPrice(row.monthly_price_min)) {
    return null;
  }

  const coverImage = findCoverImage(row.property_images);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    coverImageUrl: coverImage ? resolvePropertyImageUrl(coverImage.storage_path) : null,
    coverImageAlt: coverImage?.alt_text ?? null,
    tags: row.tags ?? [],
  };
}
