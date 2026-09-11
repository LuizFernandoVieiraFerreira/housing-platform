import type { Booking, BookingDetail, BookingListItem, BookingQuote } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

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
  booking_price_snapshots:
    | { total_krw: number }
    | { total_krw: number }[]
    | null;
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

export async function quoteBooking(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<BookingQuote> {
  const { data, error } = await supabase.rpc('quote_booking', {
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_guest_count: input.guestCount,
  });

  if (error) {
    throw error;
  }

  const row = (data as QuoteRow[] | null)?.[0];

  if (!row) {
    throw new Error('Unable to quote this stay');
  }

  return mapQuoteRow(row);
}

export async function createBookingHold(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string;
}): Promise<Booking> {
  const { data, error } = await supabase.rpc('create_booking_hold', {
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_guest_count: input.guestCount,
    p_customer_notes: input.customerNotes ?? null,
  });

  if (error) {
    throw error;
  }

  return data as Booking;
}

export async function fetchMyBookings(): Promise<BookingListItem[]> {
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
    throw error;
  }

  return ((data ?? []) as BookingListRow[])
    .map(mapBookingListRow)
    .filter((booking): booking is BookingListItem => booking !== null);
}

export async function fetchBookingDetail(bookingId: string): Promise<BookingDetail | null> {
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
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as BookingDetailRow;
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
    serviceFeePercent:
      snapshot.rent_krw > 0
        ? Math.round((snapshot.service_fee_krw / snapshot.rent_krw) * 100)
        : 0,
    pricingVersion: snapshot.pricing_version,
    propertyId: row.property_id,
    roomId: row.room_id,
  };
}

export async function cancelOwnBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase.rpc('cancel_own_booking', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }

  return data as Booking;
}
