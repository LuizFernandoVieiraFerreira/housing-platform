import type {
  BookingStatus,
  BookingType,
} from '../../bookings/dto/booking-enums.dto';

export interface HostBookingDto {
  id: string;
  status: BookingStatus;
  bookingType: BookingType;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes: string | null;
  propertyTitle: string;
  roomName: string;
  totalKrw: number;
  createdAt: string;
}
