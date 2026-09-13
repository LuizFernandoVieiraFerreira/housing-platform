import type {
  PropertyDetail,
  PropertySearchFilters,
  PropertySearchResult,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type {
  PropertyCoordinatesRow,
  PropertyDetailRow,
  SearchPropertyRow,
} from '../model';
import { filtersToRpcPayload, SEARCH_RESULTS_PAGE_SIZE } from '../model';

import { mapPropertyDetail, mapSearchProperty } from './mappers';

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
    throw wrapSupabaseError(error, 'Unable to search properties');
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
    throw wrapSupabaseError(error, 'Unable to load property details');
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as PropertyDetailRow;

  const { data: coordinates, error: coordinatesError } = await supabase.rpc(
    'get_property_coordinates',
    { p_property_id: propertyId },
  );

  if (coordinatesError) {
    throw wrapSupabaseError(coordinatesError, 'Unable to load property location');
  }

  const coordinateRow = (coordinates?.[0] as PropertyCoordinatesRow | undefined) ?? null;

  return mapPropertyDetail(row, coordinateRow);
}
