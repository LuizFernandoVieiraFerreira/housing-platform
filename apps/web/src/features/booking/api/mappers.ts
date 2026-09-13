/**
 * Data transformation functions for booking API responses.
 *
 * Mappers convert between:
 * - API/Supabase row format (snake_case)
 * - Domain model format (camelCase)
 *
 * This centralizes all data transformation logic for easier testing
 * and maintenance.
 */

import type { Booking } from '@housing-platform/types';

import type {
  BookingDetail,
  BookingDetailRow,
  BookingListItem,
  BookingListRow,
  BookingPriceSnapshotRow,
  BookingQuote,
  BookingQuoteRow,
} from '../model';
import { calculateServiceFeePercent } from '../model';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract single item from Supabase relation (handles array vs object).
 */
export function extractFirstQuoteRow(
  data: BookingQuoteRow[] | null | undefined,
): BookingQuoteRow | null {
  return data?.[0] ?? null;
}

export function mapBookingRecord(data: unknown): Booking | null {
  if (typeof data !== 'object' || data === null || !('id' in data)) {
    return null;
  }

  return data as Booking;
}

export function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ============================================================================
// Response → Domain Mappers
// ============================================================================

/**
 * Map quote response row to domain model.
 */
export function mapQuoteRow(row: BookingQuoteRow): BookingQuote {
  return {
    roomId: row.room_id,
    propertyId: row.property_id,
    bookingMode: row.booking_mode,
    nights: row.nights,
    rentKrw: row.rent_krw,
    serviceFeeKrw: row.service_fee_krw,
    totalKrw: row.total_krw,
    pricingVersion: row.pricing_version,
  };
}

/**
 * Map booking list row to domain model.
 * Returns null if required relations are missing.
 */
export function mapBookingListRow(row: BookingListRow): BookingListItem | null {
  const property = getRelation(row.properties);
  const room = getRelation(row.rooms);
  const snapshot = getRelation(row.booking_price_snapshots);

  if (!property || !room || !snapshot) {
    return null;
  }

  return {
    id: row.id,
    status: row.status as BookingListItem['status'],
    bookingType: row.booking_type as BookingListItem['bookingType'],
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestCount: row.guest_count,
    propertyTitle: property.title,
    district: property.district,
    roomName: room.name,
    totalKrw: snapshot.total_krw,
    holdExpiresAt: row.hold_expires_at,
    createdAt: row.created_at,
  };
}

/**
 * Map booking detail row to domain model.
 * Returns null if required relations are missing.
 */
export function mapBookingDetailRow(row: BookingDetailRow): BookingDetail | null {
  const listItem = mapBookingListRow(row);
  const snapshot = getRelation(row.booking_price_snapshots) as BookingPriceSnapshotRow | null;

  if (!listItem || !snapshot) {
    return null;
  }

  return {
    ...listItem,
    customerNotes: row.customer_notes,
    rentKrw: snapshot.rent_krw,
    serviceFeeKrw: snapshot.service_fee_krw,
    serviceFeePercent: calculateServiceFeePercent(snapshot.rent_krw, snapshot.service_fee_krw),
    pricingVersion: snapshot.pricing_version,
    propertyId: row.property_id,
    roomId: row.room_id,
  };
}

// ============================================================================
// Domain → Request Mappers (if needed for mutations)
// ============================================================================

/**
 * Map booking form input to API request parameters.
 */
export function toCreateBookingRequest(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string;
}) {
  return {
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_guest_count: input.guestCount,
    p_customer_notes: input.customerNotes ?? null,
  };
}

/**
 * Map quote input to API request parameters.
 */
export function toQuoteRequest(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}) {
  return {
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_guest_count: input.guestCount,
  };
}
