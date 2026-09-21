import type { AccommodationType } from './accommodation-type';
import type { BookingMode } from './booking-mode';
import type { PropertyAmenityDto } from './property-amenity';
import type { PropertyImageDto } from './property-image';
import type { PropertyRoomDto } from './property-room';

export interface PropertyDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: AccommodationType;
  district: string;
  nearestStationName: string | null;
  nearestStationWalkMin: number | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  bookingMode: BookingMode;
  minStayNights: number;
  monthlyPriceMin: number;
  tags: string[];
  hostDisplayName: string;
  latitude: number | null;
  longitude: number | null;
  images: PropertyImageDto[];
  rooms: PropertyRoomDto[];
  amenities: PropertyAmenityDto[];
}
