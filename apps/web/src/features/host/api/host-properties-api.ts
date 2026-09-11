import type {
  AmenityOption,
  HostBookingListItem,
  HostPropertyDetail,
  HostPropertyListItem,
  HostRoomDetail,
} from '@housing-platform/types';
import type { HostPropertyInput, HostRoomInput } from '@housing-platform/validation';

import { submitPropertyForReview } from '@/features/listings/api/properties-api';
import { fetchCurrentHost } from '@/features/host/api/host-api';
import { supabase } from '@/shared/api/supabase';

function createPropertySlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${base || 'listing'}-${crypto.randomUUID().slice(0, 8)}`;
}

function parseTags(tags: string | undefined): string[] {
  if (!tags?.trim()) {
    return [];
  }

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    propertyType: row.property_type as HostPropertyListItem['propertyType'],
    district: String(row.district),
    status: row.status as HostPropertyListItem['status'],
    bookingMode: row.booking_mode as HostPropertyListItem['bookingMode'],
    monthlyPriceMin: (row.monthly_price_min as number | null) ?? null,
    roomCount: Array.isArray(row.rooms) ? row.rooms.length : 0,
    updatedAt: String(row.updated_at),
  }));
}

export async function fetchAmenities(): Promise<AmenityOption[]> {
  const { data, error } = await supabase
    .from('amenities')
    .select('id, slug, name')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
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
    throw error;
  }

  if (!data) {
    return null;
  }

  const { data: coordinates } = await supabase.rpc('get_host_property_coordinates', {
    p_property_id: propertyId,
  });

  const coordinateRow = (coordinates as Array<{ latitude: number; longitude: number }> | null)?.[0];

  const row = data as Record<string, unknown> & {
    property_amenities?: Array<{ amenity_id: string }>;
    rooms?: Array<Record<string, unknown>>;
  };

  const rooms = (row.rooms ?? []).map(
      (room): HostRoomDetail => ({
        id: String(room.id),
        name: String(room.name),
        roomType: (room.room_type as string | null) ?? null,
        sizeSqm: room.size_sqm == null ? null : Number(room.size_sqm),
        maxOccupancy: Number(room.max_occupancy),
        monthlyPriceKrw: Number(room.monthly_price_krw),
        status: room.status as HostRoomDetail['status'],
        availableFrom: (room.available_from as string | null) ?? null,
      }),
    );

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description),
    propertyType: row.property_type as HostPropertyDetail['propertyType'],
    addressLine1: String(row.address_line1),
    addressLine2: (row.address_line2 as string | null) ?? null,
    city: String(row.city),
    postalCode: (row.postal_code as string | null) ?? null,
    district: String(row.district),
    nearestStationName: (row.nearest_station_name as string | null) ?? null,
    nearestStationWalkMin: row.nearest_station_walk_min == null ? null : Number(row.nearest_station_walk_min),
    status: row.status as HostPropertyDetail['status'],
    bookingMode: row.booking_mode as HostPropertyDetail['bookingMode'],
    minStayNights: Number(row.min_stay_nights),
    tags: (row.tags as string[]) ?? [],
    latitude: coordinateRow?.latitude ?? null,
    longitude: coordinateRow?.longitude ?? null,
    amenityIds: (row.property_amenities ?? []).map((item) => item.amenity_id),
    rooms,
  };
}

export async function createHostProperty(input: HostPropertyInput): Promise<string> {
  const slug = createPropertySlug(input.title);
  const host = await fetchCurrentHost();

  if (!host) {
    throw new Error('Host profile is required before creating listings');
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
    throw error;
  }

  const propertyId = data.id as string;

  if (input.latitude != null && input.longitude != null) {
    await setPropertyLocation(propertyId, input.latitude, input.longitude);
  }

  await syncPropertyAmenities(propertyId, input.amenityIds);

  return propertyId;
}

export async function updateHostProperty(propertyId: string, input: HostPropertyInput): Promise<void> {
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
    throw error;
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
    throw error;
  }
}

async function syncPropertyAmenities(propertyId: string, amenityIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);

  if (deleteError) {
    throw deleteError;
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
    throw insertError;
  }
}

export async function createHostRoom(propertyId: string, input: HostRoomInput): Promise<HostRoomDetail> {
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
    .select('id, name, room_type, size_sqm, max_occupancy, monthly_price_krw, status, available_from')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id as string,
    name: data.name as string,
    roomType: (data.room_type as string | null) ?? null,
    sizeSqm: data.size_sqm == null ? null : Number(data.size_sqm),
    maxOccupancy: Number(data.max_occupancy),
    monthlyPriceKrw: Number(data.monthly_price_krw),
    status: data.status as HostRoomDetail['status'],
    availableFrom: (data.available_from as string | null) ?? null,
  };
}

export async function deleteHostRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);

  if (error) {
    throw error;
  }
}

export async function submitHostPropertyForReview(propertyId: string) {
  return submitPropertyForReview(propertyId);
}

type HostBookingRow = {
  id: string;
  status: HostBookingListItem['status'];
  booking_type: HostBookingListItem['bookingType'];
  check_in: string;
  check_out: string;
  guest_count: number;
  customer_notes: string | null;
  created_at: string;
  properties: { title: string } | { title: string }[] | null;
  rooms: { name: string } | { name: string }[] | null;
  booking_price_snapshots: { total_krw: number } | { total_krw: number }[] | null;
};

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
    throw error;
  }

  return ((data ?? []) as HostBookingRow[])
    .map((row) => {
      const property = getRelation(row.properties);
      const room = getRelation(row.rooms);
      const snapshot = getRelation(row.booking_price_snapshots);

      if (!property || !room || !snapshot) {
        return null;
      }

      return {
        id: row.id,
        status: row.status,
        bookingType: row.booking_type,
        checkIn: row.check_in,
        checkOut: row.check_out,
        guestCount: row.guest_count,
        customerNotes: row.customer_notes,
        propertyTitle: property.title,
        roomName: room.name,
        totalKrw: snapshot.total_krw,
        createdAt: row.created_at,
      };
    })
    .filter((booking): booking is HostBookingListItem => booking !== null);
}

export async function approveHostBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('approve_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectHostBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('reject_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }

  return data;
}
