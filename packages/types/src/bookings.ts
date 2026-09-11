import type { BookingMode } from './properties';

export type BookingStatus =
  | 'requested'
  | 'pending_payment'
  | 'expired'
  | 'confirmed'
  | 'payment_failed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type BookingType = 'instant' | 'request';

export interface BookingQuote {
  roomId: string;
  propertyId: string;
  bookingMode: BookingMode;
  nights: number;
  rentKrw: number;
  serviceFeeKrw: number;
  totalKrw: number;
  pricingVersion: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  room_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  status: BookingStatus;
  booking_type: BookingType;
  hold_expires_at: string | null;
  customer_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  cancelled_at: string | null;
  payment_retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookingPriceSnapshot {
  booking_id: string;
  rent_krw: number;
  service_fee_krw: number;
  utilities_krw: number;
  total_krw: number;
  pricing_version: string;
  nightly_breakdown: unknown;
  created_at: string;
}

export interface BookingListItem {
  id: string;
  status: BookingStatus;
  bookingType: BookingType;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  propertyTitle: string;
  district: string;
  roomName: string;
  totalKrw: number;
  holdExpiresAt: string | null;
  createdAt: string;
}

export interface BookingDetail extends BookingListItem {
  customerNotes: string | null;
  rentKrw: number;
  serviceFeeKrw: number;
  serviceFeePercent: number;
  pricingVersion: string;
  propertyId: string;
  roomId: string;
}
