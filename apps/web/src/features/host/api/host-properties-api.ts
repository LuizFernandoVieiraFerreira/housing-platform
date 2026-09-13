import type {
  AmenityOption,
  HostBookingListItem,
  HostPropertyDetail,
  HostPropertyListItem,
  HostRoomDetail,
  HostPropertyInput,
  HostRoomInput,
  HostPropertyListRow,
  HostPropertyDetailRow,
  HostRoomRow,
  HostBookingRow,
  CoordinatesRow,
} from '../model';
import { createPropertySlug, parseTags } from '../model';
import {
  mapPropertyListRows,
  mapPropertyDetailRow,
  mapRoomRow,
  mapBookingRows,
} from './mappers';

import { submitPropertyForReview } from '@/features/listings/api/properties-api';
import { fetchCurrentHost } from '@/features/host/api/host-api';
import { supabase } from '@/shared/api/supabase';
import { AppError, wrapSupabaseError } from '@/shared/lib/errors';

export async function fetchHostProperties(): Promise<HostPropertyListItem[]> {
  const { data, error } = await supabase
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
}

export async function fetchAmenities(): Promise<AmenityOption[]> {
  const { data, error } = await supabase
    .from('amenities')
    .select('id, slug, name')
    .order('sort_order', { ascending: true });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load amenities');
  }

  return (data ?? []) as AmenityOption[];
}

export async function fetchHostProperty(propertyId: string): Promise<HostPropertyDetail | null> {
  const { data, error } = await supabase
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

  const { data: coordinates } = await supabase.rpc('get_host_property_coordinates', {
    p_property_id: propertyId,
  });

  const coordinateRow = (coordinates as CoordinatesRow[] | null)?.[0] ?? null;

  return mapPropertyDetailRow(data as HostPropertyDetailRow, coordinateRow);
}

export async function createHostProperty(input: HostPropertyInput): Promise<string> {
  const slug = createPropertySlug(input.title);
  const host = await fetchCurrentHost();

  if (!host) {
    throw new AppError('FORBIDDEN', 'Host profile is required before creating listings');
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      host_id: host.id,
      title: input.title,
      slug,
      description: input.description,
      property_type: input.propertyType,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 || null,
      city: input.city,
      postal_code: input.postalCode || null,
      district: input.district,
      nearest_station_name: input.nearestStationName || null,
      nearest_station_walk_min:
        input.nearestStationWalkMin === '' || input.nearestStationWalkMin == null
          ? null
          : Number(input.nearestStationWalkMin),
      booking_mode: input.bookingMode,
      min_stay_nights: input.minStayNights,
      tags: parseTags(input.tags),
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to create listing');
  }

  const propertyId = data.id as string;

  if (input.latitude != null && input.longitude != null) {
    await setPropertyLocation(propertyId, input.latitude, input.longitude);
  }

  await syncPropertyAmenities(propertyId, input.amenityIds);

  return propertyId;
}

export async function updateHostProperty(
  propertyId: string,
  input: HostPropertyInput,
): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({
      title: input.title,
      description: input.description,
      property_type: input.propertyType,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 || null,
      city: input.city,
      postal_code: input.postalCode || null,
      district: input.district,
      nearest_station_name: input.nearestStationName || null,
      nearest_station_walk_min:
        input.nearestStationWalkMin === '' || input.nearestStationWalkMin == null
          ? null
          : Number(input.nearestStationWalkMin),
      booking_mode: input.bookingMode,
      min_stay_nights: input.minStayNights,
      tags: parseTags(input.tags),
    })
    .eq('id', propertyId);

  if (error) {
    throw wrapSupabaseError(error, 'Unable to update listing');
  }

  if (input.latitude != null && input.longitude != null) {
    await setPropertyLocation(propertyId, input.latitude, input.longitude);
  }

  await syncPropertyAmenities(propertyId, input.amenityIds);
}

export async function setPropertyLocation(
  propertyId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const { error } = await supabase.rpc('set_property_location', {
    p_property_id: propertyId,
    p_latitude: latitude,
    p_longitude: longitude,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to set property location');
  }
}

async function syncPropertyAmenities(propertyId: string, amenityIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);

  if (deleteError) {
    throw wrapSupabaseError(deleteError, 'Unable to update amenities');
  }

  if (amenityIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('property_amenities').insert(
    amenityIds.map((amenityId) => ({
      property_id: propertyId,
      amenity_id: amenityId,
    })),
  );

  if (insertError) {
    throw wrapSupabaseError(insertError, 'Unable to update amenities');
  }
}

export async function createHostRoom(
  propertyId: string,
  input: HostRoomInput,
): Promise<HostRoomDetail> {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      property_id: propertyId,
      name: input.name,
      room_type: input.roomType || null,
      size_sqm: input.sizeSqm === '' || input.sizeSqm == null ? null : Number(input.sizeSqm),
      max_occupancy: input.maxOccupancy,
      monthly_price_krw: input.monthlyPriceKrw,
      available_from: input.availableFrom || null,
      status: 'available',
    })
    .select(
      'id, name, room_type, size_sqm, max_occupancy, monthly_price_krw, status, available_from',
    )
    .single();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to create room');
  }

  return mapRoomRow(data as HostRoomRow);
}

export async function deleteHostRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);

  if (error) {
    throw wrapSupabaseError(error, 'Unable to delete room');
  }
}

export async function submitHostPropertyForReview(propertyId: string) {
  return submitPropertyForReview(propertyId);
}

export async function fetchHostBookings(): Promise<HostBookingListItem[]> {
  const { data, error } = await supabase
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
}

export async function approveHostBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('approve_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to approve booking');
  }

  return data;
}

export async function rejectHostBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('reject_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to reject booking');
  }

  return data;
}
