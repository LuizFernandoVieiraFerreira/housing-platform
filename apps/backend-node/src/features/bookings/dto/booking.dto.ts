import type { BookingStatus, BookingType } from './booking-enums.dto';

/** OpenAPI Booking response. */
export interface BookingDto {
  id: string;
  customerId: string;
  roomId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: BookingStatus;
  bookingType: BookingType;
  holdExpiresAt: string | null;
  customerNotes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  cancelledAt: string | null;
  paymentRetryCount: number;
  createdAt: string;
  updatedAt: string;
}
