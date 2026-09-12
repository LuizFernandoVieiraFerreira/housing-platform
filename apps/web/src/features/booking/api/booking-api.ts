import type {
  Booking,
  BookingDetail,
  BookingListItem,
  BookingQuote,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { AppError, Result, unwrap } from '@/shared/lib/result';

type QuoteRow = {
  room_id: string;
  property_id: string;
  booking_mode: BookingQuote['bookingMode'];
  nights: number;
  rent_krw: number;
  service_fee_krw: number;
  total_krw: number;
  pricing_version: string;
};

type BookingListRow = {
  id: string;
  status: BookingListItem['status'];
  booking_type: BookingListItem['bookingType'];
  check_in: string;
  check_out: string;
  guest_count: number;
  hold_expires_at: string | null;
  created_at: string;
  properties: { title: string; district: string } | { title: string; district: string }[] | null;
  rooms: { name: string } | { name: string }[] | null;
  booking_price_snapshots: { total_krw: number } | { total_krw: number }[] | null;
};

type BookingPriceSnapshotRow = {
  rent_krw: number;
  service_fee_krw: number;
  total_krw: number;
  pricing_version: string;
};

type BookingDetailRow = BookingListRow & {
  customer_notes: string | null;
  property_id: string;
  room_id: string;
  booking_price_snapshots: BookingPriceSnapshotRow | BookingPriceSnapshotRow[] | null;
};

function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapQuoteRow(row: QuoteRow): BookingQuote {
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

function mapBookingListRow(row: BookingListRow): BookingListItem | null {
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
    propertyTitle: property.title,
    district: property.district,
    roomName: room.name,
    totalKrw: snapshot.total_krw,
    holdExpiresAt: row.hold_expires_at,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Result-Returning API Functions
// ============================================================================

/**
 * Get a price quote for a potential booking. Returns a Result.
 */
export async function quoteBookingSafe(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<Result<BookingQuote>> {
  try {
    const { data, error } = await supabase.rpc('quote_booking', {
      p_room_id: input.roomId,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_guest_count: input.guestCount,
    });

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to quote this stay'));
    }

    const row = (data as QuoteRow[] | null)?.[0];

    if (!row) {
      return Result.err(new AppError('BOOKING_UNAVAILABLE', 'Unable to quote this stay'));
    }

    return Result.ok(mapQuoteRow(row));
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

/**
 * Create a booking hold (reservation). Returns a Result.
 */
export async function createBookingHoldSafe(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string;
}): Promise<Result<Booking>> {
  try {
    const { data, error } = await supabase.rpc('create_booking_hold', {
      p_room_id: input.roomId,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_guest_count: input.guestCount,
      p_customer_notes: input.customerNotes ?? null,
    });

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to create booking'));
    }

    return Result.ok(data as Booking);
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

/**
 * Fetch all bookings for the current user. Returns a Result.
 */
export async function fetchMyBookingsSafe(): Promise<Result<BookingListItem[]>> {
  try {
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
          hold_expires_at,
          created_at,
          properties ( title, district ),
          rooms ( name ),
          booking_price_snapshots ( total_krw )
        `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to load bookings'));
    }

    const bookings = ((data ?? []) as BookingListRow[])
      .map(mapBookingListRow)
      .filter((booking): booking is BookingListItem => booking !== null);

    return Result.ok(bookings);
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

/**
 * Fetch details for a specific booking. Returns a Result.
 */
export async function fetchBookingDetailSafe(
  bookingId: string,
): Promise<Result<BookingDetail | null>> {
  try {
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
          hold_expires_at,
          created_at,
          customer_notes,
          property_id,
          room_id,
          properties ( title, district ),
          rooms ( name ),
          booking_price_snapshots (
            rent_krw,
            service_fee_krw,
            total_krw,
            pricing_version
          )
        `,
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to load booking'));
    }

    if (!data) {
      return Result.ok(null);
    }

    const row = data as BookingDetailRow;
    const listItem = mapBookingListRow(row);
    const snapshot = getRelation(row.booking_price_snapshots) as BookingPriceSnapshotRow | null;

    if (!listItem || !snapshot) {
      return Result.ok(null);
    }

    return Result.ok({
      ...listItem,
      customerNotes: row.customer_notes,
      rentKrw: snapshot.rent_krw,
      serviceFeeKrw: snapshot.service_fee_krw,
      serviceFeePercent:
        snapshot.rent_krw > 0 ? Math.round((snapshot.service_fee_krw / snapshot.rent_krw) * 100) : 0,
      pricingVersion: snapshot.pricing_version,
      propertyId: row.property_id,
      roomId: row.room_id,
    });
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

/**
 * Cancel a booking owned by the current user. Returns a Result.
 */
export async function cancelOwnBookingSafe(bookingId: string): Promise<Result<Booking>> {
  try {
    const { data, error } = await supabase.rpc('cancel_own_booking', {
      p_booking_id: bookingId,
    });

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to cancel booking'));
    }

    return Result.ok(data as Booking);
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

// ============================================================================
// Throwing API Functions (for TanStack Query compatibility)
// ============================================================================

/**
 * Get a price quote for a potential booking.
 * @deprecated Prefer quoteBookingSafe for explicit error handling.
 */
export async function quoteBooking(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<BookingQuote> {
  return unwrap(await quoteBookingSafe(input));
}

/**
 * Create a booking hold (reservation).
 * @deprecated Prefer createBookingHoldSafe for explicit error handling.
 */
export async function createBookingHold(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string;
}): Promise<Booking> {
  return unwrap(await createBookingHoldSafe(input));
}

/**
 * Fetch all bookings for the current user.
 * @deprecated Prefer fetchMyBookingsSafe for explicit error handling.
 */
export async function fetchMyBookings(): Promise<BookingListItem[]> {
  return unwrap(await fetchMyBookingsSafe());
}

/**
 * Fetch details for a specific booking.
 * @deprecated Prefer fetchBookingDetailSafe for explicit error handling.
 */
export async function fetchBookingDetail(bookingId: string): Promise<BookingDetail | null> {
  return unwrap(await fetchBookingDetailSafe(bookingId));
}

/**
 * Cancel a booking owned by the current user.
 * @deprecated Prefer cancelOwnBookingSafe for explicit error handling.
 */
export async function cancelOwnBooking(bookingId: string): Promise<Booking> {
  return unwrap(await cancelOwnBookingSafe(bookingId));
}
