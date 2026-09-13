/**
 * Booking feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for booking types within the feature.
 */

// Re-export shared types from the types package
export type {
  Booking,
  BookingDetail,
  BookingListItem,
  BookingPriceSnapshot,
  BookingQuote,
  BookingStatus,
  BookingType,
} from '@housing-platform/types';

// Re-export input types from validation package
export type {
  CreateBookingHoldInput,
  QuoteBookingInput,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * Row type returned by Supabase for booking quotes.
 * Used internally by mappers.
 */
export interface BookingQuoteRow {
  room_id: string;
  property_id: string;
  booking_mode: 'instant' | 'request';
  nights: number;
  rent_krw: number;
  service_fee_krw: number;
  total_krw: number;
  pricing_version: string;
}

/**
 * Row type returned by Supabase for booking list queries.
 * Used internally by mappers.
 */
export interface BookingListRow {
  id: string;
  status: string;
  booking_type: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  hold_expires_at: string | null;
  created_at: string;
  properties: { title: string; district: string } | { title: string; district: string }[] | null;
  rooms: { name: string } | { name: string }[] | null;
  booking_price_snapshots: { total_krw: number } | { total_krw: number }[] | null;
}

/**
 * Row type for price snapshot in booking details.
 */
export interface BookingPriceSnapshotRow {
  rent_krw: number;
  service_fee_krw: number;
  total_krw: number;
  pricing_version: string;
}

/**
 * Extended row type for booking detail queries.
 */
export interface BookingDetailRow extends BookingListRow {
  customer_notes: string | null;
  property_id: string;
  room_id: string;
  booking_price_snapshots: BookingPriceSnapshotRow | BookingPriceSnapshotRow[] | null;
}
