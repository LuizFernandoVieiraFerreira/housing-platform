import type { AccommodationType } from './accommodation-type';
import type { BookingMode } from './booking-mode';

export interface HostPropertyRequest {
  title: string;
  description: string;
  propertyType: AccommodationType;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode?: string | null;
  district: string;
  nearestStationName?: string | null;
  nearestStationWalkMin?: number | null;
  bookingMode: BookingMode;
  minStayNights: number;
  tags?: string[];
  amenityIds?: string[];
  latitude?: number | null;
  longitude?: number | null;
}
