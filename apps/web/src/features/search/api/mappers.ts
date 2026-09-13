/**
 * Data transformation functions for search API responses.
 *
 * Mappers convert between:
 * - API/Supabase row format (snake_case)
 * - Domain model format (camelCase)
 *
 * This centralizes all data transformation logic for easier testing
 * and maintenance.
 */

import { resolvePropertyImageUrl } from '@/features/listings/lib/image-url';

import type {
  AiPropertySearchResponse,
  AiSearchFunctionResponse,
  AiSearchPropertyRow,
  PropertyCoordinatesRow,
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRoom,
  PropertyDetailRow,
  SearchPropertyCard,
  SearchPropertyRow,
} from '../model';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract single item from Supabase relation (handles array vs object).
 */
export function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ============================================================================
// Search Property Mappers
// ============================================================================

/**
 * Map search result row to domain model.
 */
export function mapSearchProperty(row: SearchPropertyRow): SearchPropertyCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    coverImageUrl: row.cover_storage_path
      ? resolvePropertyImageUrl(row.cover_storage_path)
      : null,
    coverImageAlt: row.cover_alt_text,
    tags: row.tags ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distance_meters,
  };
}

// ============================================================================
// Property Detail Mappers
// ============================================================================

/**
 * Map property images from row format.
 * Sorts by cover status first, then sort_order.
 */
export function mapPropertyImages(
  images: PropertyDetailRow['property_images'],
): PropertyDetailImage[] {
  return [...(images ?? [])]
    .sort((left, right) => {
      if (left.is_cover !== right.is_cover) {
        return left.is_cover ? -1 : 1;
      }
      return left.sort_order - right.sort_order;
    })
    .map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      url: resolvePropertyImageUrl(image.storage_path),
      altText: image.alt_text,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
    }));
}

/**
 * Map property rooms from row format.
 * Filters to available rooms only and sorts by price.
 */
export function mapPropertyRooms(
  rooms: PropertyDetailRow['rooms'],
): PropertyDetailRoom[] {
  return [...(rooms ?? [])]
    .filter((room) => room.status === 'available')
    .sort((left, right) => left.monthly_price_krw - right.monthly_price_krw)
    .map((room) => ({
      id: room.id,
      name: room.name,
      roomType: room.room_type,
      sizeSqm: room.size_sqm,
      maxOccupancy: room.max_occupancy,
      monthlyPriceKrw: room.monthly_price_krw,
      status: room.status,
      availableFrom: room.available_from,
    }));
}

/**
 * Map property amenities from row format.
 * Filters out null amenities and sorts by sort_order.
 */
export function mapPropertyAmenities(
  amenities: PropertyDetailRow['property_amenities'],
): PropertyDetailAmenity[] {
  return [...(amenities ?? [])]
    .map((entry) => entry.amenities)
    .filter((amenity): amenity is NonNullable<typeof amenity> => amenity != null)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((amenity) => ({
      id: amenity.id,
      slug: amenity.slug,
      name: amenity.name,
      icon: amenity.icon,
    }));
}

/**
 * Map property detail row to domain model.
 * Returns null if required data is missing.
 */
export function extractCoordinateRow(
  coordinates: PropertyCoordinatesRow[] | null | undefined,
): PropertyCoordinatesRow | null {
  return coordinates?.[0] ?? null;
}

export function mapAiSearchPropertyRow(item: AiSearchPropertyRow): SearchPropertyCard {
  if (item.coverImageUrl) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      propertyType: item.propertyType,
      district: item.district,
      nearestStationName: item.nearestStationName,
      monthlyPriceMin: item.monthlyPriceMin,
      coverImageUrl: item.coverImageUrl,
      coverImageAlt: item.coverImageAlt,
      tags: item.tags ?? [],
      latitude: item.latitude,
      longitude: item.longitude,
      distanceMeters: item.distanceMeters,
    };
  }

  return mapSearchProperty({
    id: item.id,
    title: item.title,
    slug: item.slug,
    property_type: item.propertyType,
    district: item.district,
    nearest_station_name: item.nearestStationName,
    monthly_price_min: item.monthlyPriceMin,
    tags: item.tags,
    cover_storage_path: item.coverImageStoragePath ?? null,
    cover_alt_text: item.coverImageAlt,
    latitude: item.latitude,
    longitude: item.longitude,
    distance_meters: item.distanceMeters,
    total_count: 0,
  });
}

export function mapAiSearchResponse(payload: AiSearchFunctionResponse): AiPropertySearchResponse {
  return {
    items: (payload.items ?? []).map(mapAiSearchPropertyRow),
    totalCount: payload.totalCount ?? 0,
    interpretedFilters: payload.interpretedFilters ?? {},
    explanation: payload.explanation,
    fallbackUsed: payload.fallbackUsed,
  };
}

export function mapPropertyDetail(
  row: PropertyDetailRow,
  coordinates: PropertyCoordinatesRow | null,
): PropertyDetail | null {
  if (row.monthly_price_min == null) {
    return null;
  }

  const hostRecord = getRelation(row.hosts);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    nearestStationWalkMin: row.nearest_station_walk_min,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    bookingMode: row.booking_mode,
    minStayNights: row.min_stay_nights,
    monthlyPriceMin: row.monthly_price_min,
    tags: row.tags ?? [],
    hostDisplayName: hostRecord?.display_name ?? 'Host',
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    images: mapPropertyImages(row.property_images),
    rooms: mapPropertyRooms(row.rooms),
    amenities: mapPropertyAmenities(row.property_amenities),
  };
}
