import type { AccommodationType } from './accommodation-type';
import type { PropertySearchSort } from './property-search-sort';

export interface PropertySearchQuery {
  query?: string | null;
  propertyType?: AccommodationType | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  sort?: PropertySearchSort;
  centerLat?: number | null;
  centerLng?: number | null;
  north?: number | null;
  south?: number | null;
  east?: number | null;
  west?: number | null;
  amenitySlugs?: string[] | null;
  maxStationWalkMin?: number | null;
  excludePropertyIds?: string[] | null;
  limit?: number;
  offset?: number;
}
