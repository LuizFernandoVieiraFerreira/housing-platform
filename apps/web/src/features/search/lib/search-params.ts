import type { PropertySearchFilters } from '@housing-platform/types';
import { propertySearchFiltersSchema } from '@housing-platform/validation';

const SEOUL_CENTER = {
  centerLat: 37.5665,
  centerLng: 126.978,
};

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
      guests: 1,
      sort: 'recommended',
      ...SEOUL_CENTER,
    };
  }

  const filters: PropertySearchFilters = {
    guests: parsed.data.guests ?? 1,
    sort: parsed.data.sort ?? 'recommended',
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

  if (filters.sort && filters.sort !== 'recommended') {
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

export function filtersToRpcPayload(filters: PropertySearchFilters): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sort: filters.sort ?? 'recommended',
  };

  if (filters.query) {
    payload.query = filters.query;
  }

  if (filters.propertyType) {
    payload.property_type = filters.propertyType;
  }

  if (filters.checkIn) {
    payload.check_in = filters.checkIn;
  }

  if (filters.checkOut) {
    payload.check_out = filters.checkOut;
  }

  if (filters.guests != null) {
    payload.guests = filters.guests;
  }

  if (filters.priceMin != null) {
    payload.price_min = filters.priceMin;
  }

  if (filters.priceMax != null) {
    payload.price_max = filters.priceMax;
  }

  if (filters.centerLat != null) {
    payload.center_lat = filters.centerLat;
  }

  if (filters.centerLng != null) {
    payload.center_lng = filters.centerLng;
  }

  if (
    filters.north != null &&
    filters.south != null &&
    filters.east != null &&
    filters.west != null
  ) {
    payload.north = filters.north;
    payload.south = filters.south;
    payload.east = filters.east;
    payload.west = filters.west;
  }

  if (filters.amenitySlugs?.length) {
    payload.amenity_slugs = filters.amenitySlugs;
  }

  if (filters.maxStationWalkMin != null) {
    payload.max_station_walk_min = filters.maxStationWalkMin;
  }

  if (filters.excludePropertyIds?.length) {
    payload.exclude_property_ids = filters.excludePropertyIds;
  }

  return payload;
}

export { SEOUL_CENTER };
