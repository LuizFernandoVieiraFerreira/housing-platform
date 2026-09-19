import type {
  PropertyDetail,
  PropertySearchFilters,
  PropertySearchResult,
} from '@housing-platform/types';

import { registerApiRoute } from '@/shared/api/client';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { PropertyCoordinatesRow, PropertyDetailRow, SearchPropertyRow } from '../model';
import { filtersToRpcPayload, SEARCH_RESULTS_PAGE_SIZE } from '../model';

import { extractCoordinateRow, mapPropertyDetail, mapSearchProperty } from './mappers';

interface SearchPropertiesBody {
  filters: PropertySearchFilters;
  limit: number;
  offset: number;
}

const searchPropertiesRequest = registerApiRoute<PropertySearchResult>(
  'search',
  'GET',
  '/properties',
  async ({ client, body }) => {
    const { filters, limit, offset } = body as SearchPropertiesBody;
    const { data, error } = await client.rpc('search_properties', {
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
  },
);

export function searchProperties(
  filters: PropertySearchFilters,
  limit = SEARCH_RESULTS_PAGE_SIZE,
  offset = 0,
): Promise<PropertySearchResult> {
  return searchPropertiesRequest({
    body: { filters, limit, offset },
    anonymous: true,
  });
}

const fetchPropertyDetailRequest = registerApiRoute<PropertyDetail | null>(
  'properties',
  'GET',
  '/properties/:id',
  async ({ client, params }) => {
    const propertyId = params.id ?? '';
    const { data, error } = await client
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

    const { data: coordinates, error: coordinatesError } = await client.rpc(
      'get_property_coordinates',
      { p_property_id: propertyId },
    );

    if (coordinatesError) {
      throw wrapSupabaseError(coordinatesError, 'Unable to load property location');
    }

    return mapPropertyDetail(row, extractCoordinateRow(coordinates as PropertyCoordinatesRow[] | null));
  },
);

export function fetchPropertyDetail(propertyId: string): Promise<PropertyDetail | null> {
  return fetchPropertyDetailRequest({
    params: { id: propertyId },
    anonymous: true,
  });
}
