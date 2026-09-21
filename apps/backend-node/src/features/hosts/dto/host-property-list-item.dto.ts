import type { AccommodationType } from '../../properties/dto/accommodation-type';
import type { BookingMode } from '../../properties/dto/booking-mode';
import type { PropertyStatus } from '../../properties/dto/property-status';

export interface HostPropertyListItemDto {
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
