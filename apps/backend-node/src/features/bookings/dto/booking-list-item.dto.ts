import type { BookingStatus, BookingType } from './booking-enums.dto';

/** OpenAPI BookingListItem response. */
export interface BookingListItemDto {
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
