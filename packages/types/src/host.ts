import type { BookingStatus, BookingType } from './bookings';
import type { AccommodationType, BookingMode, PropertyStatus, RoomStatus } from './properties';

export type HostStatus = 'pending' | 'active' | 'suspended';

export interface Host {
  id: string;
  profile_id: string;
  display_name: string;
  status: HostStatus;
  verified_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostRecord {
  id: string;
  profile_id: string;
  display_name: string;
  status: HostStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostPropertyListItem {
  id: string;
  title: string;
  slug: string;
  propertyType: AccommodationType;
  district: string;
  status: PropertyStatus;
  bookingMode: BookingMode;
  monthlyPriceMin: number | null;
  roomCount: number;
  updatedAt: string;
}

export interface HostPropertyDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: AccommodationType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  district: string;
  nearestStationName: string | null;
  nearestStationWalkMin: number | null;
  status: PropertyStatus;
  bookingMode: BookingMode;
  minStayNights: number;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  amenityIds: string[];
  rooms: HostRoomDetail[];
}

export interface HostRoomDetail {
  id: string;
  name: string;
  roomType: string | null;
  sizeSqm: number | null;
  maxOccupancy: number;
  monthlyPriceKrw: number;
  status: RoomStatus;
  availableFrom: string | null;
}

export interface HostBookingListItem {
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
