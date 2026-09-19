import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@housing-platform/types';

import type {
  AmenityOption,
  HostBookingListItem,
  HostPropertyDetail,
  HostPropertyListItem,
  HostRoomDetail,
  HostPropertyInput,
  HostRoomInput,
  AmenityOptionRow,
  HostPropertyListRow,
  HostPropertyDetailRow,
  HostRoomRow,
  HostBookingRow,
} from '../model';
import { createPropertySlug } from '../model';
import {
  extractCoordinateRow,
  mapAmenityOptionRows,
  mapBookingRows,
  mapPropertyDetailRow,
  mapPropertyListRows,
  mapRoomRow,
  toCreateHostPropertyPayload,
  toHostPropertyPayload,
  toHostRoomInsertPayload,
  toPropertyAmenityRows,
} from './mappers';

import { submitPropertyForReview } from '@/features/listings/api/properties-api';
import { fetchCurrentHost } from '@/features/host/api/host-api';
import { registerApiRoute } from '@/shared/api/client';
import { AppError, wrapSupabaseError } from '@/shared/lib/errors';

export const fetchHostProperties = registerApiRoute<HostPropertyListItem[]>(
  'hosts',
  'GET',
  '/hosts/me/properties',
  async ({ client }) => {
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

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load your properties');
    }

    return mapPropertyListRows((data ?? []) as HostPropertyListRow[]);
  },
);

export const fetchAmenities = registerApiRoute<AmenityOption[]>(
  'hosts',
  'GET',
  '/amenities',
  async ({ client }) => {
    const { data, error } = await client
      .from('amenities')
      .select('id, slug, name')
      .order('sort_order', { ascending: true });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load amenities');
    }

    return mapAmenityOptionRows((data ?? []) as AmenityOptionRow[]);
  },
);

const fetchHostPropertyRequest = registerApiRoute<HostPropertyDetail | null>(
  'hosts',
  'GET',
  '/hosts/me/properties/:id',
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

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load property details');
    }

    if (!data) {
      return null;
    }

    const { data: coordinates } = await client.rpc('get_host_property_coordinates', {
      p_property_id: propertyId,
    });

    return mapPropertyDetailRow(data as HostPropertyDetailRow, extractCoordinateRow(coordinates));
  },
);

export function fetchHostProperty(propertyId: string): Promise<HostPropertyDetail | null> {
  return fetchHostPropertyRequest({ params: { id: propertyId } });
}

const setPropertyLocationRequest = registerApiRoute<void>(
  'hosts',
  'POST',
  '/properties/:id/location',
  async ({ client, params, body }) => {
    const { latitude, longitude } = body as { latitude: number; longitude: number };
    const { error } = await client.rpc('set_property_location', {
      p_property_id: params.id,
      p_latitude: latitude,
      p_longitude: longitude,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to set property location');
    }
  },
);

export function setPropertyLocation(
  propertyId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  return setPropertyLocationRequest({
    params: { id: propertyId },
    body: { latitude, longitude },
  });
}

async function syncPropertyAmenities(
  client: SupabaseClient<Database>,
  propertyId: string,
  amenityIds: string[],
): Promise<void> {
  const { error: deleteError } = await client
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);

  if (deleteError) {
    throw wrapSupabaseError(deleteError, 'Unable to update amenities');
  }

  if (amenityIds.length === 0) {
    return;
  }

  const { error: insertError } = await client
    .from('property_amenities')
    .insert(toPropertyAmenityRows(propertyId, amenityIds));

  if (insertError) {
    throw wrapSupabaseError(insertError, 'Unable to update amenities');
  }
}

const createHostPropertyRequest = registerApiRoute<string>(
  'hosts',
  'POST',
  '/properties',
  async ({ client, body }) => {
    const input = body as HostPropertyInput;
    const slug = createPropertySlug(input.title);
    const host = await fetchCurrentHost();

    if (!host) {
      throw new AppError('FORBIDDEN', 'Host profile is required before creating listings');
    }

    const { data, error } = await client
      .from('properties')
      .insert(toCreateHostPropertyPayload(input, host.id, slug))
      .select('id')
      .single();

    if (error) {
      throw wrapSupabaseError(error, 'Unable to create listing');
    }

    const propertyId = data.id as string;

    if (input.latitude != null && input.longitude != null) {
      await setPropertyLocation(propertyId, input.latitude, input.longitude);
    }

    await syncPropertyAmenities(client, propertyId, input.amenityIds);

    return propertyId;
  },
);

export function createHostProperty(input: HostPropertyInput): Promise<string> {
  return createHostPropertyRequest({ body: input });
}

const updateHostPropertyRequest = registerApiRoute<void>(
  'hosts',
  'PATCH',
  '/properties/:id',
  async ({ client, params, body }) => {
    const input = body as HostPropertyInput;
    const propertyId = params.id ?? '';
    const { error } = await client
      .from('properties')
      .update(toHostPropertyPayload(input))
      .eq('id', propertyId);

    if (error) {
      throw wrapSupabaseError(error, 'Unable to update listing');
    }

    if (input.latitude != null && input.longitude != null) {
      await setPropertyLocation(propertyId, input.latitude, input.longitude);
    }

    await syncPropertyAmenities(client, propertyId, input.amenityIds);
  },
);

export function updateHostProperty(propertyId: string, input: HostPropertyInput): Promise<void> {
  return updateHostPropertyRequest({ params: { id: propertyId }, body: input });
}

const createHostRoomRequest = registerApiRoute<HostRoomDetail>(
  'hosts',
  'POST',
  '/properties/:id/rooms',
  async ({ client, params, body }) => {
    const input = body as HostRoomInput;
    const { data, error } = await client
      .from('rooms')
      .insert(toHostRoomInsertPayload(params.id ?? '', input))
      .select(
        'id, name, room_type, size_sqm, max_occupancy, monthly_price_krw, status, available_from',
      )
      .single();

    if (error) {
      throw wrapSupabaseError(error, 'Unable to create room');
    }

    return mapRoomRow(data as HostRoomRow);
  },
);

export function createHostRoom(propertyId: string, input: HostRoomInput): Promise<HostRoomDetail> {
  return createHostRoomRequest({ params: { id: propertyId }, body: input });
}

const deleteHostRoomRequest = registerApiRoute<void>(
  'hosts',
  'DELETE',
  '/rooms/:roomId',
  async ({ client, params }) => {
    const { error } = await client.from('rooms').delete().eq('id', params.roomId ?? '');

    if (error) {
      throw wrapSupabaseError(error, 'Unable to delete room');
    }
  },
);

export function deleteHostRoom(roomId: string): Promise<void> {
  return deleteHostRoomRequest({ params: { roomId } });
}

export function submitHostPropertyForReview(propertyId: string) {
  return submitPropertyForReview(propertyId);
}

export const fetchHostBookings = registerApiRoute<HostBookingListItem[]>(
  'hosts',
  'GET',
  '/hosts/me/bookings',
  async ({ client }) => {
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

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load bookings');
    }

    return mapBookingRows((data ?? []) as HostBookingRow[]);
  },
);

const approveHostBookingRequest = registerApiRoute<unknown>(
  'hosts',
  'POST',
  '/bookings/:id/approve',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('approve_booking_request', {
      p_booking_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to approve booking');
    }

    return data;
  },
);

export function approveHostBooking(bookingId: string) {
  return approveHostBookingRequest({ params: { id: bookingId } });
}

const rejectHostBookingRequest = registerApiRoute<unknown>(
  'hosts',
  'POST',
  '/bookings/:id/reject',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('reject_booking_request', {
      p_booking_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to reject booking');
    }

    return data;
  },
);

export function rejectHostBooking(bookingId: string) {
  return rejectHostBookingRequest({ params: { id: bookingId } });
}
