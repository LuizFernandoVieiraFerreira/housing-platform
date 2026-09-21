import type { PropertySearchQuery } from './dto/property-search-query';
import { PropertySearchSort } from './dto/property-search-sort';

export interface SearchPropertyRow {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  district: string;
  nearestStationName: string | null;
  monthlyPriceMin: number;
  tags: string[] | null;
  coverStoragePath: string | null;
  coverAltText: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  totalCount: number;
}

export interface PropertySearchCriteria {
  textQuery: string | null;
  propertyType: string | null;
  priceMin: number | null;
  priceMax: number | null;
  guests: number | null;
  stayNights: number | null;
  checkIn: string | null;
  sort: PropertySearchSort;
  centerLat: number | null;
  centerLng: number | null;
  north: number | null;
  south: number | null;
  east: number | null;
  west: number | null;
  hasBounds: boolean;
  maxStationWalkMin: number | null;
  amenitySlugs: string[] | null;
  excludePropertyIds: string[] | null;
}

function parseDateOnly(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') {
    return null;
  }
  return value.trim();
}

function diffDays(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function toSearchCriteria(query: PropertySearchQuery): PropertySearchCriteria {
  const checkIn = parseDateOnly(query.checkIn);
  const checkOut = parseDateOnly(query.checkOut);

  let stayNights: number | null = null;
  if (checkIn && checkOut) {
    stayNights = diffDays(checkIn, checkOut);
  }

  const hasBounds =
    query.north != null &&
    query.south != null &&
    query.east != null &&
    query.west != null;

  const textQuery =
    query.query && query.query.trim() !== '' ? query.query.trim() : null;

  return {
    textQuery,
    propertyType: query.propertyType ?? null,
    priceMin: query.priceMin ?? null,
    priceMax: query.priceMax ?? null,
    guests: query.guests ?? null,
    stayNights,
    checkIn,
    sort: query.sort ?? PropertySearchSort.Recommended,
    centerLat: query.centerLat ?? null,
    centerLng: query.centerLng ?? null,
    north: query.north ?? null,
    south: query.south ?? null,
    east: query.east ?? null,
    west: query.west ?? null,
    hasBounds,
    maxStationWalkMin: query.maxStationWalkMin ?? null,
    amenitySlugs:
      query.amenitySlugs && query.amenitySlugs.length > 0
        ? query.amenitySlugs
        : null,
    excludePropertyIds:
      query.excludePropertyIds && query.excludePropertyIds.length > 0
        ? query.excludePropertyIds
        : null,
  };
}
