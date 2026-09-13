/**
 * Host feature API mappers.
 *
 * Transform Supabase row types into domain types.
 * These functions are pure and have no side effects.
 */

import type {
  HostPropertyListItem,
  HostPropertyDetail,
  HostRoomDetail,
  HostBookingListItem,
  HostPropertyListRow,
  HostPropertyDetailRow,
  HostRoomRow,
  HostBookingRow,
  CoordinatesRow,
} from '../model';
import { getRelation } from '../model';

// ============================================================================
// Property Mappers
// ============================================================================

/**
 * Map a Supabase property list row to a HostPropertyListItem.
 */
export function mapPropertyListRow(row: HostPropertyListRow): HostPropertyListItem {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    propertyType: row.property_type as HostPropertyListItem['propertyType'],
    district: String(row.district),
    status: row.status as HostPropertyListItem['status'],
    bookingMode: row.booking_mode as HostPropertyListItem['bookingMode'],
    monthlyPriceMin: row.monthly_price_min ?? null,
    roomCount: Array.isArray(row.rooms) ? row.rooms.length : 0,
    updatedAt: String(row.updated_at),
  };
}

/**
 * Map multiple Supabase property list rows.
 */
export function mapPropertyListRows(rows: HostPropertyListRow[]): HostPropertyListItem[] {
  return rows.map(mapPropertyListRow);
}

// ============================================================================
// Room Mappers
// ============================================================================

/**
 * Map a Supabase room row to a HostRoomDetail.
 */
export function mapRoomRow(row: HostRoomRow): HostRoomDetail {
  return {
    id: String(row.id),
    name: String(row.name),
    roomType: row.room_type ?? null,
    sizeSqm: row.size_sqm == null ? null : Number(row.size_sqm),
    maxOccupancy: Number(row.max_occupancy),
    monthlyPriceKrw: Number(row.monthly_price_krw),
    status: row.status as HostRoomDetail['status'],
    availableFrom: row.available_from ?? null,
  };
}

/**
 * Map multiple Supabase room rows.
 */
export function mapRoomRows(rows: HostRoomRow[]): HostRoomDetail[] {
  return rows.map(mapRoomRow);
}

// ============================================================================
// Property Detail Mappers
// ============================================================================

/**
 * Map a Supabase property detail row with coordinates to a HostPropertyDetail.
 */
export function mapPropertyDetailRow(
  row: HostPropertyDetailRow,
  coordinates: CoordinatesRow | null,
): HostPropertyDetail {
  const rooms = mapRoomRows(row.rooms ?? []);

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description),
    propertyType: row.property_type as HostPropertyDetail['propertyType'],
    addressLine1: String(row.address_line1),
    addressLine2: row.address_line2 ?? null,
    city: String(row.city),
    postalCode: row.postal_code ?? null,
    district: String(row.district),
    nearestStationName: row.nearest_station_name ?? null,
    nearestStationWalkMin:
      row.nearest_station_walk_min == null ? null : Number(row.nearest_station_walk_min),
    status: row.status as HostPropertyDetail['status'],
    bookingMode: row.booking_mode as HostPropertyDetail['bookingMode'],
    minStayNights: Number(row.min_stay_nights),
    tags: row.tags ?? [],
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    amenityIds: (row.property_amenities ?? []).map((item) => item.amenity_id),
    rooms,
  };
}

// ============================================================================
// Booking Mappers
// ============================================================================

/**
 * Map a Supabase booking row to a HostBookingListItem.
 * Returns null if required relations are missing.
 */
export function mapBookingRow(row: HostBookingRow): HostBookingListItem | null {
  const property = getRelation(row.properties);
  const room = getRelation(row.rooms);
  const snapshot = getRelation(row.booking_price_snapshots);

  if (!property || !room || !snapshot) {
    return null;
  }

  return {
    id: row.id,
    status: row.status as HostBookingListItem['status'],
    bookingType: row.booking_type as HostBookingListItem['bookingType'],
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestCount: row.guest_count,
    customerNotes: row.customer_notes,
    propertyTitle: property.title,
    roomName: room.name,
    totalKrw: snapshot.total_krw,
    createdAt: row.created_at,
  };
}

/**
 * Map multiple Supabase booking rows, filtering out invalid ones.
 */
export function mapBookingRows(rows: HostBookingRow[]): HostBookingListItem[] {
  return rows
    .map(mapBookingRow)
    .filter((booking): booking is HostBookingListItem => booking !== null);
}
