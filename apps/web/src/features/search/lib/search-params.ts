import type { PropertySearchFilters } from '@housing-platform/types';

import {
  DEFAULT_GUEST_COUNT,
  DEFAULT_SORT,
  filtersToRpcPayload,
  propertySearchFiltersSchema,
  SEOUL_CENTER,
} from '../model';

export function parseSearchParams(searchParams: URLSearchParams): PropertySearchFilters {
  const raw = {
    query: searchParams.get('q') ?? '',
    propertyType: searchParams.get('type') ?? '',
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: searchParams.get('guests') ?? undefined,
    priceMin: searchParams.get('priceMin') ?? undefined,
    priceMax: searchParams.get('priceMax') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    centerLat: searchParams.get('centerLat') ?? undefined,
    centerLng: searchParams.get('centerLng') ?? undefined,
    north: searchParams.get('north') ?? undefined,
    south: searchParams.get('south') ?? undefined,
    east: searchParams.get('east') ?? undefined,
    west: searchParams.get('west') ?? undefined,
  };

  const parsed = propertySearchFiltersSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      guests: DEFAULT_GUEST_COUNT,
      sort: DEFAULT_SORT,
      ...SEOUL_CENTER,
    };
  }

  const filters: PropertySearchFilters = {
    guests: parsed.data.guests ?? DEFAULT_GUEST_COUNT,
    sort: parsed.data.sort ?? DEFAULT_SORT,
    centerLat: parsed.data.centerLat ?? SEOUL_CENTER.centerLat,
    centerLng: parsed.data.centerLng ?? SEOUL_CENTER.centerLng,
  };

  if (parsed.data.query) {
    filters.query = parsed.data.query;
  }

  if (parsed.data.propertyType) {
    filters.propertyType = parsed.data.propertyType;
  }

  if (parsed.data.checkIn) {
    filters.checkIn = parsed.data.checkIn;
  }

  if (parsed.data.checkOut) {
    filters.checkOut = parsed.data.checkOut;
  }

  if (parsed.data.priceMin != null) {
    filters.priceMin = parsed.data.priceMin;
  }

  if (parsed.data.priceMax != null) {
    filters.priceMax = parsed.data.priceMax;
  }

  if (parsed.data.north != null) {
    filters.north = parsed.data.north;
  }

  if (parsed.data.south != null) {
    filters.south = parsed.data.south;
  }

  if (parsed.data.east != null) {
    filters.east = parsed.data.east;
  }

  if (parsed.data.west != null) {
    filters.west = parsed.data.west;
  }

  return filters;
}

export function parseAiSearchParams(searchParams: URLSearchParams): {
  aiQuery: string;
  referencePropertyId?: string;
} {
  const aiQuery = searchParams.get('aiq')?.trim() ?? '';
  const referencePropertyId = searchParams.get('ref')?.trim() || undefined;

  return {
    aiQuery,
    referencePropertyId,
  };
}

export function buildSearchParams(filters: PropertySearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('q', filters.query);
  }

  if (filters.propertyType) {
    params.set('type', filters.propertyType);
  }

  if (filters.checkIn) {
    params.set('checkIn', filters.checkIn);
  }

  if (filters.checkOut) {
    params.set('checkOut', filters.checkOut);
  }

  if (filters.guests != null) {
    params.set('guests', String(filters.guests));
  }

  if (filters.priceMin != null) {
    params.set('priceMin', String(filters.priceMin));
  }

  if (filters.priceMax != null) {
    params.set('priceMax', String(filters.priceMax));
  }

  if (filters.sort && filters.sort !== DEFAULT_SORT) {
    params.set('sort', filters.sort);
  }

  if (filters.centerLat != null) {
    params.set('centerLat', String(filters.centerLat));
  }

  if (filters.centerLng != null) {
    params.set('centerLng', String(filters.centerLng));
  }

  if (filters.north != null) {
    params.set('north', String(filters.north));
  }

  if (filters.south != null) {
    params.set('south', String(filters.south));
  }

  if (filters.east != null) {
    params.set('east', String(filters.east));
  }

  if (filters.west != null) {
    params.set('west', String(filters.west));
  }

  return params;
}

export function buildAiSearchParams(input: {
  aiQuery?: string;
  referencePropertyId?: string;
  filters?: PropertySearchFilters;
}): URLSearchParams {
  const params = input.filters ? buildSearchParams(input.filters) : new URLSearchParams();

  if (input.aiQuery?.trim()) {
    params.set('aiq', input.aiQuery.trim());
  } else {
    params.delete('aiq');
  }

  if (input.referencePropertyId) {
    params.set('ref', input.referencePropertyId);
  } else {
    params.delete('ref');
  }

  params.delete('q');

  return params;
}

export { filtersToRpcPayload, SEOUL_CENTER };
