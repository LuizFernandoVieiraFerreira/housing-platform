import type { Booking } from '@housing-platform/types';

import { registerApiRoute } from '@/shared/api/client';
import { logger, createTimer } from '@/shared/lib/logger';
import { AppError, Result } from '@/shared/lib/result';

import type {
  BookingDetail,
  BookingDetailRow,
  BookingListItem,
  BookingListRow,
  BookingQuote,
  BookingQuoteRow,
} from '../model';
import {
  extractFirstQuoteRow,
  mapBookingDetailRow,
  mapBookingListRow,
  mapBookingRecord,
  mapQuoteRow,
  toCreateBookingRequest,
  toQuoteRequest,
} from './mappers';

const log = logger.child('booking-api');

interface QuoteBookingInput {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

interface CreateBookingHoldInput {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string;
}

const quoteBookingRequest = registerApiRoute<Result<BookingQuote>>(
  'bookings',
  'GET',
  '/bookings/quote',
  async ({ client, body }) => {
    const input = body as QuoteBookingInput;
    try {
      const { data, error } = await client.rpc('quote_booking', toQuoteRequest(input));

      if (error) {
        return Result.err(AppError.fromSupabase(error, 'Unable to quote this stay'));
      }

      const row = extractFirstQuoteRow(data as BookingQuoteRow[] | null);

      if (!row) {
        return Result.err(new AppError('BOOKING_UNAVAILABLE', 'Unable to quote this stay'));
      }

      return Result.ok(mapQuoteRow(row));
    } catch (error) {
      return Result.fromError(error, 'API_ERROR');
    }
  },
);

/**
 * Get a price quote for a potential booking. Returns a Result.
 */
export function quoteBooking(input: QuoteBookingInput): Promise<Result<BookingQuote>> {
  return quoteBookingRequest({ body: input });
}

const createBookingHoldRequest = registerApiRoute<Result<Booking>>(
  'bookings',
  'POST',
  '/bookings',
  async ({ client, body }) => {
    const input = body as CreateBookingHoldInput;
    const timer = createTimer();
    log.info('Creating booking hold', {
      action: 'createBookingHold',
      data: { roomId: input.roomId, checkIn: input.checkIn, checkOut: input.checkOut },
    });

    try {
      const { data, error } = await client.rpc('create_booking_hold', toCreateBookingRequest(input));

      if (error) {
        const appError = AppError.fromSupabase(error, 'Unable to create booking');
        log.error('Booking hold creation failed', {
          action: 'createBookingHold',
          error: appError,
          data: { roomId: input.roomId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      const booking = mapBookingRecord(data);

      if (!booking) {
        const appError = new AppError('API_ERROR', 'Unable to create booking');
        log.error('Booking hold creation returned invalid payload', {
          action: 'createBookingHold',
          error: appError,
          data: { roomId: input.roomId, durationMs: timer() },
        });
        return Result.err(appError);
      }

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
  },
);

/**
 * Create a booking hold (reservation). Returns a Result.
 */
export function createBookingHold(input: CreateBookingHoldInput): Promise<Result<Booking>> {
  return createBookingHoldRequest({ body: input });
}

/**
 * Fetch all bookings for the current user. Returns a Result.
 */
export const fetchMyBookings = registerApiRoute<Result<BookingListItem[]>>(
  'bookings',
  'GET',
  '/bookings',
  async ({ client }) => {
    try {
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
  },
);

const fetchBookingDetailRequest = registerApiRoute<Result<BookingDetail | null>>(
  'bookings',
  'GET',
  '/bookings/:id',
  async ({ client, params }) => {
    const bookingId = params.id ?? '';
    try {
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
  },
);

/**
 * Fetch details for a specific booking. Returns a Result.
 */
export function fetchBookingDetail(bookingId: string): Promise<Result<BookingDetail | null>> {
  return fetchBookingDetailRequest({ params: { id: bookingId } });
}

const cancelOwnBookingRequest = registerApiRoute<Result<Booking>>(
  'bookings',
  'POST',
  '/bookings/:id/cancel',
  async ({ client, params }) => {
    const bookingId = params.id ?? '';
    const timer = createTimer();
    log.info('Cancelling booking', { action: 'cancelBooking', data: { bookingId } });

    try {
      const { data, error } = await client.rpc('cancel_own_booking', {
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
      const booking = mapBookingRecord(data);

      if (!booking) {
        const appError = new AppError('API_ERROR', 'Unable to cancel booking');
        log.error('Booking cancellation returned invalid payload', {
          action: 'cancelBooking',
          error: appError,
          data: { bookingId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      return Result.ok(booking);
    } catch (error) {
      log.error('Booking cancellation threw exception', {
        action: 'cancelBooking',
        error,
        data: { bookingId, durationMs: timer() },
      });
      return Result.fromError(error, 'API_ERROR');
    }
  },
);

/**
 * Cancel a booking owned by the current user. Returns a Result.
 */
export function cancelOwnBooking(bookingId: string): Promise<Result<Booking>> {
  return cancelOwnBookingRequest({ params: { id: bookingId } });
}
