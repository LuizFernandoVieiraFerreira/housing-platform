import type { AccommodationType } from './accommodation-type';

export interface SearchPropertyCard {
  id: string;
  title: string;
  slug: string;
  propertyType: AccommodationType;
  district: string;
  nearestStationName: string | null;
  monthlyPriceMin: number;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  tags: string[];
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
}
