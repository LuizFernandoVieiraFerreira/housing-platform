import type { AccommodationType } from './accommodation-type';
import type { BookingMode } from './booking-mode';
import type { HostRoomDto } from './host-room';
import type { PropertyStatus } from './property-status';

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
  rooms: HostRoomDto[];
}
