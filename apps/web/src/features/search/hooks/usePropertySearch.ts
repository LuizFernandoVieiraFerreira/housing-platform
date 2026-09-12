import { useQuery } from '@tanstack/react-query';
import type { PropertySearchFilters } from '@housing-platform/types';

import { searchProperties } from '../api/search-api';
import { searchKeys } from '../keys';

export function usePropertySearch(filters: PropertySearchFilters) {
  return useQuery({
    queryKey: searchKeys.search(filtersToStableKey(filters)),
    queryFn: () => searchProperties(filters),
    staleTime: 30_000,
  });
}

function filtersToStableKey(filters: PropertySearchFilters): Record<string, unknown> {
  return {
    query: filters.query ?? '',
    propertyType: filters.propertyType ?? '',
    checkIn: filters.checkIn ?? '',
    checkOut: filters.checkOut ?? '',
    guests: filters.guests ?? 1,
    priceMin: filters.priceMin ?? '',
    priceMax: filters.priceMax ?? '',
    sort: filters.sort ?? 'recommended',
    centerLat: filters.centerLat ?? '',
    centerLng: filters.centerLng ?? '',
    north: filters.north ?? '',
    south: filters.south ?? '',
    east: filters.east ?? '',
    west: filters.west ?? '',
  };
}
