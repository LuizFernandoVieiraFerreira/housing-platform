import { registerSupabaseRoute } from '../supabase-adapter';
import {
  assertNoSupabaseError,
  parseQueryInt,
  requirePathParam,
  requireQueryString,
} from './helpers';

export const BOOKING_ROUTES = [
  { method: 'GET' as const, path: '/bookings/quote' },
  { method: 'GET' as const, path: '/bookings' },
  { method: 'POST' as const, path: '/bookings' },
  { method: 'GET' as const, path: '/bookings/:id' },
  { method: 'POST' as const, path: '/bookings/:id/cancel' },
  { method: 'POST' as const, path: '/bookings/:id/approve' },
  { method: 'POST' as const, path: '/bookings/:id/reject' },
];

export function registerBookingRoutes(): void {
  registerSupabaseRoute('GET', '/bookings/quote', async ({ client, query }) => {
    const roomId = requireQueryString(query, 'roomId');
    const checkIn = requireQueryString(query, 'checkIn');
    const checkOut = requireQueryString(query, 'checkOut');
    const guestCount = parseQueryInt(query, 'guestCount', 1);

    const { data, error } = await client.rpc('quote_booking', {
      p_room_id: roomId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_count: guestCount,
    });

    assertNoSupabaseError(error, 'Unable to quote this stay');
    return data;
  });

  registerSupabaseRoute('GET', '/bookings', async ({ client }) => {
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

    assertNoSupabaseError(error, 'Unable to load bookings');
    return data ?? [];
  });

  registerSupabaseRoute('POST', '/bookings', async ({ client, body }) => {
    const input = body as {
      roomId?: string;
      checkIn?: string;
      checkOut?: string;
      guestCount?: number;
      customerNotes?: string | null;
    };

    const { data, error } = await client.rpc('create_booking_hold', {
      p_room_id: input.roomId ?? '',
      p_check_in: input.checkIn ?? '',
      p_check_out: input.checkOut ?? '',
      p_guest_count: input.guestCount ?? 1,
      p_customer_notes: input.customerNotes ?? null,
    });

    assertNoSupabaseError(error, 'Unable to create booking');
    return data;
  });

  registerSupabaseRoute('GET', '/bookings/:id', async ({ client, params }) => {
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
      .eq('id', requirePathParam(params, 'id'))
      .maybeSingle();

    assertNoSupabaseError(error, 'Unable to load booking');
    return data;
  });

  registerSupabaseRoute('POST', '/bookings/:id/cancel', async ({ client, params }) => {
    const { data, error } = await client.rpc('cancel_own_booking', {
      p_booking_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to cancel booking');
    return data;
  });

  registerSupabaseRoute('POST', '/bookings/:id/approve', async ({ client, params }) => {
    const { data, error } = await client.rpc('approve_booking_request', {
      p_booking_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to approve booking');
    return data;
  });

  registerSupabaseRoute('POST', '/bookings/:id/reject', async ({ client, params }) => {
    const { data, error } = await client.rpc('reject_booking_request', {
      p_booking_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to reject booking');
    return data;
  });
}
