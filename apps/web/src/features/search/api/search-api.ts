import type {
  PropertyDetail,
  PropertyDetailAmenity,
  PropertyDetailImage,
  PropertyDetailRoom,
  PropertySearchFilters,
  PropertySearchResult,
  SearchPropertyCard,
} from '@housing-platform/types';

import { resolvePropertyImageUrl } from '@/features/listings/lib/image-url';
import { SEARCH_RESULTS_PAGE_SIZE } from '@/features/search/lib/search-config';
import { filtersToRpcPayload } from '@/features/search/lib/search-params';
import { supabase } from '@/shared/api/supabase';

type SearchPropertyRow = {
  id: string;
  title: string;
  slug: string;
  property_type: SearchPropertyCard['propertyType'];
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
};

type PropertyDetailRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyDetail['propertyType'];
  district: string;
  nearest_station_name: string | null;
  nearest_station_walk_min: number | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  booking_mode: PropertyDetail['bookingMode'];
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
    status: PropertyDetailRoom['status'];
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
};

function mapSearchProperty(row: SearchPropertyRow): SearchPropertyCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    coverImageUrl: row.cover_storage_path ? resolvePropertyImageUrl(row.cover_storage_path) : null,
    coverImageAlt: row.cover_alt_text,
    tags: row.tags ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distance_meters,
  };
}

export { mapSearchProperty };

export async function searchProperties(
  filters: PropertySearchFilters,
  limit = SEARCH_RESULTS_PAGE_SIZE,
  offset = 0,
): Promise<PropertySearchResult> {
  const { data, error } = await supabase.rpc('search_properties', {
    p_filters: filtersToRpcPayload(filters),
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SearchPropertyRow[];

  return {
    items: rows.map(mapSearchProperty),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export async function fetchPropertyDetail(propertyId: string): Promise<PropertyDetail | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
        id,
        title,
        slug,
        description,
        property_type,
        district,
        nearest_station_name,
        nearest_station_walk_min,
        address_line1,
        address_line2,
        city,
        booking_mode,
        min_stay_nights,
        monthly_price_min,
        tags,
        hosts ( display_name ),
        property_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_cover
        ),
        rooms (
          id,
          name,
          room_type,
          size_sqm,
          max_occupancy,
          monthly_price_krw,
          status,
          available_from
        ),
        property_amenities (
          amenities (
            id,
            slug,
            name,
            icon,
            sort_order
          )
        )
      `,
    )
    .eq('id', propertyId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as PropertyDetailRow;

  if (row.monthly_price_min == null) {
    return null;
  }

  const monthlyPriceMin = row.monthly_price_min;

  const { data: coordinates, error: coordinatesError } = await supabase.rpc(
    'get_property_coordinates',
    { p_property_id: propertyId },
  );

  if (coordinatesError) {
    throw coordinatesError;
  }

  const coordinateRow = coordinates?.[0] as { latitude: number; longitude: number } | undefined;

  const images: PropertyDetailImage[] = [...(row.property_images ?? [])]
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

  const rooms: PropertyDetailRoom[] = [...(row.rooms ?? [])]
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

  const amenities: PropertyDetailAmenity[] = [...(row.property_amenities ?? [])]
    .map((entry) => entry.amenities)
    .filter((amenity): amenity is NonNullable<typeof amenity> => amenity != null)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((amenity) => ({
      id: amenity.id,
      slug: amenity.slug,
      name: amenity.name,
      icon: amenity.icon,
    }));

  const hostRecord = Array.isArray(row.hosts) ? row.hosts[0] : row.hosts;

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
    monthlyPriceMin,
    tags: row.tags ?? [],
    hostDisplayName: hostRecord?.display_name ?? 'Host',
    latitude: coordinateRow?.latitude ?? null,
    longitude: coordinateRow?.longitude ?? null,
    images,
    rooms,
    amenities,
  };
}
