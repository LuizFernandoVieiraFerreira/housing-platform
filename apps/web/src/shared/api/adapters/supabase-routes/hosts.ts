import { wrapSupabaseError } from '@/shared/lib/errors';

import { registerSupabaseRoute } from '../supabase-adapter';
import { assertNoSupabaseError, requirePathParam } from './helpers';

export const HOST_ROUTES = [
  { method: 'POST' as const, path: '/hosts' },
  { method: 'GET' as const, path: '/hosts/me' },
  { method: 'GET' as const, path: '/hosts/me/properties' },
  { method: 'GET' as const, path: '/hosts/me/properties/:id' },
  { method: 'GET' as const, path: '/hosts/me/bookings' },
];

export function registerHostRoutes(): void {
  registerSupabaseRoute('POST', '/hosts', async ({ client, body }) => {
    const input = body as { displayName?: string };

    const { data, error } = await client.rpc('register_as_host', {
      p_display_name: input.displayName ?? '',
    });

    assertNoSupabaseError(error, 'Unable to register as host');
    return data;
  });

  registerSupabaseRoute('GET', '/hosts/me', async ({ client }) => {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError) {
      throw wrapSupabaseError(userError, 'Unable to verify authentication');
    }

    if (!user) {
      return null;
    }

    const { data, error } = await client
      .from('hosts')
      .select('id, profile_id, display_name, status, verified_at, created_at, updated_at')
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    assertNoSupabaseError(error, 'Unable to load host profile');
    return data;
  });

  registerSupabaseRoute('GET', '/hosts/me/properties', async ({ client }) => {
    const { data, error } = await client
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        property_type,
        district,
        status,
        booking_mode,
        monthly_price_min,
        updated_at,
        rooms ( id )
      `,
      )
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load your properties');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/hosts/me/properties/:id', async ({ client, params }) => {
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
        address_line1,
        address_line2,
        city,
        postal_code,
        district,
        nearest_station_name,
        nearest_station_walk_min,
        status,
        booking_mode,
        min_stay_nights,
        tags,
        location,
        property_amenities ( amenity_id ),
        rooms (
          id,
          name,
          room_type,
          size_sqm,
          max_occupancy,
          monthly_price_krw,
          status,
          available_from
        )
      `,
      )
      .eq('id', propertyId)
      .is('deleted_at', null)
      .maybeSingle();

    assertNoSupabaseError(error, 'Unable to load property details');

    if (!data) {
      return null;
    }

    const { data: coordinates } = await client.rpc('get_host_property_coordinates', {
      p_property_id: propertyId,
    });

    return { property: data, coordinates: coordinates ?? null };
  });

  registerSupabaseRoute('GET', '/hosts/me/bookings', async ({ client }) => {
    const { data, error } = await client
      .from('bookings')
      .select(
        `
        id,
        status,
        booking_type,
        check_in,
        check_out,
        guest_count,
        customer_notes,
        created_at,
        properties ( title ),
        rooms ( name ),
        booking_price_snapshots ( total_krw )
      `,
      )
      .order('created_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load bookings');
    return data ?? [];
  });
}
