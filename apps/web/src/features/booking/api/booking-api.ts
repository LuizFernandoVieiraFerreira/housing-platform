import type { Booking } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { logger, createTimer } from '@/shared/lib/logger';
import { AppError, Result, unwrap } from '@/shared/lib/result';

import type {
  BookingDetail,
  BookingDetailRow,
  BookingListItem,
  BookingListRow,
  BookingQuote,
  BookingQuoteRow,
} from '../model';
import {
  getRelation,
  mapBookingDetailRow,
  mapBookingListRow,
  mapQuoteRow,
  toCreateBookingRequest,
  toQuoteRequest,
} from './mappers';

const log = logger.child('booking-api');

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
    const { data, error } = await supabase.rpc('quote_booking', toQuoteRequest(input));

    if (error) {
      return Result.err(AppError.fromSupabase(error, 'Unable to quote this stay'));
    }

    const row = (data as BookingQuoteRow[] | null)?.[0];

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
  const timer = createTimer();
  log.info('Creating booking hold', {
    action: 'createBookingHold',
    data: { roomId: input.roomId, checkIn: input.checkIn, checkOut: input.checkOut },
  });

  try {
    const { data, error } = await supabase.rpc(
      'create_booking_hold',
      toCreateBookingRequest(input),
    );

    if (error) {
      const appError = AppError.fromSupabase(error, 'Unable to create booking');
      log.error('Booking hold creation failed', {
        action: 'createBookingHold',
        error: appError,
        data: { roomId: input.roomId, durationMs: timer() },
      });
      return Result.err(appError);
    }

    const booking = data as Booking;
    log.info('Booking hold created successfully', {
      action: 'createBookingHold',
      data: { bookingId: booking.id, roomId: input.roomId, durationMs: timer() },
    });
    return Result.ok(booking);
  } catch (error) {
    log.error('Booking hold creation threw exception', {
      action: 'createBookingHold',
      error,
      data: { roomId: input.roomId, durationMs: timer() },
    });
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

    const detail = mapBookingDetailRow(data as BookingDetailRow);
    return Result.ok(detail);
  } catch (error) {
    return Result.fromError(error, 'API_ERROR');
  }
}

/**
 * Cancel a booking owned by the current user. Returns a Result.
 */
export async function cancelOwnBookingSafe(bookingId: string): Promise<Result<Booking>> {
  const timer = createTimer();
  log.info('Cancelling booking', { action: 'cancelBooking', data: { bookingId } });

  try {
    const { data, error } = await supabase.rpc('cancel_own_booking', {
      p_booking_id: bookingId,
    });

    if (error) {
      const appError = AppError.fromSupabase(error, 'Unable to cancel booking');
      log.error('Booking cancellation failed', {
        action: 'cancelBooking',
        error: appError,
        data: { bookingId, durationMs: timer() },
      });
      return Result.err(appError);
    }

    log.info('Booking cancelled successfully', {
      action: 'cancelBooking',
      data: { bookingId, durationMs: timer() },
    });
    return Result.ok(data as Booking);
  } catch (error) {
    log.error('Booking cancellation threw exception', {
      action: 'cancelBooking',
      error,
      data: { bookingId, durationMs: timer() },
    });
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
