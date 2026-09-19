import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@housing-platform/types';

import { createPropertySlug } from '@/features/host/model';
import {
  toCreateHostPropertyPayload,
  toHostPropertyPayload,
  toHostRoomInsertPayload,
  toPropertyAmenityRows,
} from '@/features/host/api/mappers';

import { AppError } from '@/shared/lib/errors';

import { registerSupabaseRoute } from '../supabase-adapter';
import {
  assertNoSupabaseError,
  parseQueryInt,
  parseSearchFiltersFromQuery,
  requireHostId,
  requirePathParam,
} from './helpers';

export const PROPERTY_ROUTES = [
  { method: 'GET' as const, path: '/properties' },
  { method: 'GET' as const, path: '/properties/featured' },
  { method: 'GET' as const, path: '/properties/:id' },
  { method: 'POST' as const, path: '/properties' },
  { method: 'PATCH' as const, path: '/properties/:id' },
  { method: 'POST' as const, path: '/properties/:id/submit-review' },
  { method: 'POST' as const, path: '/properties/:id/location' },
  { method: 'POST' as const, path: '/properties/:id/rooms' },
  { method: 'DELETE' as const, path: '/rooms/:roomId' },
  { method: 'GET' as const, path: '/amenities' },
];

async function syncPropertyAmenities(
  client: SupabaseClient<Database>,
  propertyId: string,
  amenityIds: string[],
): Promise<void> {
  const { error: deleteError } = await client
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);

  assertNoSupabaseError(deleteError, 'Unable to update amenities');

  if (amenityIds.length === 0) {
    return;
  }

  const { error: insertError } = await client
    .from('property_amenities')
    .insert(toPropertyAmenityRows(propertyId, amenityIds));

  assertNoSupabaseError(insertError, 'Unable to update amenities');
}

export function registerPropertyRoutes(): void {
  registerSupabaseRoute('GET', '/properties', async ({ client, query }) => {
    const limit = parseQueryInt(query, 'limit', 20);
    const offset = parseQueryInt(query, 'offset', 0);

    const { data, error } = await client.rpc('search_properties', {
      p_filters: parseSearchFiltersFromQuery(query),
      p_limit: limit,
      p_offset: offset,
    });

    assertNoSupabaseError(error, 'Unable to search properties');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/properties/featured', async ({ client }) => {
    const { data, error } = await client
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        property_type,
        district,
        nearest_station_name,
        monthly_price_min,
        tags,
        property_images (
          storage_path,
          alt_text,
          is_cover,
          sort_order
        )
      `,
      )
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(8);

    assertNoSupabaseError(error, 'Unable to load featured properties');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/properties/:id', async ({ client, params }) => {
    const propertyId = requirePathParam(params, 'id');

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

    assertNoSupabaseError(error, 'Unable to load property details');

    if (!data) {
      return null;
    }

    const { data: coordinates, error: coordinatesError } = await client.rpc(
      'get_property_coordinates',
      { p_property_id: propertyId },
    );

    assertNoSupabaseError(coordinatesError, 'Unable to load property location');

    return { property: data, coordinates: coordinates ?? null };
  });

  registerSupabaseRoute('POST', '/properties', async ({ client, body }) => {
    const input = body as Parameters<typeof toCreateHostPropertyPayload>[0];
    const hostId = await requireHostId(client);
    const slug = createPropertySlug(input.title);

    const { data, error } = await client
      .from('properties')
      .insert(toCreateHostPropertyPayload(input, hostId, slug))
      .select('id')
      .single();

    assertNoSupabaseError(error, 'Unable to create listing');

    if (!data?.id) {
      throw new AppError('API_ERROR', 'Unable to create listing');
    }

    const propertyId = data.id;

    if (input.latitude != null && input.longitude != null) {
      const { error: locationError } = await client.rpc('set_property_location', {
        p_property_id: propertyId,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
      });
      assertNoSupabaseError(locationError, 'Unable to set property location');
    }

    await syncPropertyAmenities(client, propertyId, input.amenityIds ?? []);

    return { id: propertyId };
  });

  registerSupabaseRoute('PATCH', '/properties/:id', async ({ client, params, body }) => {
    const input = body as Parameters<typeof toHostPropertyPayload>[0];
    const propertyId = requirePathParam(params, 'id');

    const { error } = await client
      .from('properties')
      .update(toHostPropertyPayload(input))
      .eq('id', propertyId);

    assertNoSupabaseError(error, 'Unable to update listing');

    if (input.latitude != null && input.longitude != null) {
      const { error: locationError } = await client.rpc('set_property_location', {
        p_property_id: propertyId,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
      });
      assertNoSupabaseError(locationError, 'Unable to set property location');
    }

    await syncPropertyAmenities(client, propertyId, input.amenityIds ?? []);

    return null;
  });

  registerSupabaseRoute('POST', '/properties/:id/submit-review', async ({ client, params }) => {
    const { data, error } = await client.rpc('submit_property_for_review', {
      p_property_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to submit property for review');
    return data;
  });

  registerSupabaseRoute('POST', '/properties/:id/location', async ({ client, params, body }) => {
    const input = body as { latitude: number; longitude: number };

    const { error } = await client.rpc('set_property_location', {
      p_property_id: requirePathParam(params, 'id'),
      p_latitude: input.latitude,
      p_longitude: input.longitude,
    });

    assertNoSupabaseError(error, 'Unable to set property location');
    return null;
  });

  registerSupabaseRoute('POST', '/properties/:id/rooms', async ({ client, params, body }) => {
    const input = body as Parameters<typeof toHostRoomInsertPayload>[1];
    const propertyId = requirePathParam(params, 'id');

    const { data, error } = await client
      .from('rooms')
      .insert(toHostRoomInsertPayload(propertyId, input))
      .select(
        'id, name, room_type, size_sqm, max_occupancy, monthly_price_krw, status, available_from',
      )
      .single();

    assertNoSupabaseError(error, 'Unable to create room');
    return data;
  });

  registerSupabaseRoute('DELETE', '/rooms/:roomId', async ({ client, params }) => {
    const { error } = await client
      .from('rooms')
      .delete()
      .eq('id', requirePathParam(params, 'roomId'));

    assertNoSupabaseError(error, 'Unable to delete room');
    return null;
  });

  registerSupabaseRoute('GET', '/amenities', async ({ client }) => {
    const { data, error } = await client
      .from('amenities')
      .select('id, slug, name')
      .order('sort_order', { ascending: true });

    assertNoSupabaseError(error, 'Unable to load amenities');
    return data ?? [];
  });
}
