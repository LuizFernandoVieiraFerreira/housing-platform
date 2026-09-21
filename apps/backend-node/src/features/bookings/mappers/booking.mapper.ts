import type { bookings } from '@prisma/client';

import type {
  BookingDetailDto,
  BookingDto,
  BookingListItemDto,
  BookingMode,
  BookingQuoteDto,
  BookingStatus,
  BookingType,
} from '../dto';

export function calculateServiceFeePercent(
  rentKrw: number,
  serviceFeeKrw: number,
): number {
  if (rentKrw <= 0) {
    return 0;
  }

  return Math.round((serviceFeeKrw / rentKrw) * 100);
}

export function formatCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date): string {
  return value.toISOString();
}

export function mapBookingQuote(options: {
  roomId: string;
  propertyId: string;
  bookingMode: string;
  nights: number;
  rentKrw: number;
  serviceFeeKrw: number;
  totalKrw: number;
  pricingVersion: string;
}): BookingQuoteDto {
  return {
    roomId: options.roomId,
    propertyId: options.propertyId,
    bookingMode: options.bookingMode as BookingMode,
    nights: options.nights,
    rentKrw: options.rentKrw,
    serviceFeeKrw: options.serviceFeeKrw,
    totalKrw: options.totalKrw,
    pricingVersion: options.pricingVersion,
  };
}

export function mapBooking(booking: bookings): BookingDto {
  return {
    id: booking.id,
    customerId: booking.customer_id,
    roomId: booking.room_id,
    propertyId: booking.property_id,
    checkIn: formatCalendarDate(booking.check_in),
    checkOut: formatCalendarDate(booking.check_out),
    guestCount: booking.guest_count,
    status: booking.status as BookingStatus,
    bookingType: booking.booking_type as BookingType,
    holdExpiresAt: booking.hold_expires_at
      ? formatDateTime(booking.hold_expires_at)
      : null,
    customerNotes: booking.customer_notes,
    approvedAt: booking.approved_at ? formatDateTime(booking.approved_at) : null,
    approvedBy: booking.approved_by,
    cancelledAt: booking.cancelled_at
      ? formatDateTime(booking.cancelled_at)
      : null,
    paymentRetryCount: booking.payment_retry_count,
    createdAt: formatDateTime(booking.created_at),
    updatedAt: formatDateTime(booking.updated_at),
  };
}

export function mapBookingListItem(options: {
  bookingId: string;
  status: string;
  bookingType: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  propertyTitle: string;
  district: string;
  roomName: string;
  totalKrw: number;
  holdExpiresAt: Date | null;
  createdAt: Date;
}): BookingListItemDto {
  return {
    id: options.bookingId,
    status: options.status as BookingStatus,
    bookingType: options.bookingType as BookingType,
    checkIn: formatCalendarDate(options.checkIn),
    checkOut: formatCalendarDate(options.checkOut),
    guestCount: options.guestCount,
    propertyTitle: options.propertyTitle,
    district: options.district,
    roomName: options.roomName,
    totalKrw: options.totalKrw,
    holdExpiresAt: options.holdExpiresAt
      ? formatDateTime(options.holdExpiresAt)
      : null,
    createdAt: formatDateTime(options.createdAt),
  };
}

export function mapBookingDetail(
  listItem: BookingListItemDto,
  options: {
    customerNotes: string | null;
    rentKrw: number;
    serviceFeeKrw: number;
    pricingVersion: string;
    propertyId: string;
    roomId: string;
  },
): BookingDetailDto {
  return {
    ...listItem,
    customerNotes: options.customerNotes,
    rentKrw: options.rentKrw,
    serviceFeeKrw: options.serviceFeeKrw,
    serviceFeePercent: calculateServiceFeePercent(
      options.rentKrw,
      options.serviceFeeKrw,
    ),
    pricingVersion: options.pricingVersion,
    propertyId: options.propertyId,
    roomId: options.roomId,
  };
}
