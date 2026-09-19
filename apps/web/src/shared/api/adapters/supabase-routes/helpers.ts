import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@housing-platform/types';
import type { ApiErrorResponse } from '@housing-platform/types';

import { AppError, wrapSupabaseError } from '@/shared/lib/errors';

import type { QueryValue } from '../types';

export function assertNoSupabaseError(
  error: { message: string; code?: string; details?: string } | null,
  message: string,
): void {
  if (error) {
    throw wrapSupabaseError(error, message);
  }
}

export function parseQueryString(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
  key: string,
): string | undefined {
  const value = query[key];
  if (value == null || Array.isArray(value)) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

export function parseQueryInt(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
  key: string,
  fallback: number,
): number {
  const value = query[key];
  if (value == null || Array.isArray(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseQueryNumber(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
  key: string,
): number | undefined {
  const value = query[key];
  if (value == null || Array.isArray(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseQueryArray(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
  key: string,
): string[] {
  const value = query[key];
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [String(value)];
}

export function parseSearchFiltersFromQuery(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sort: parseQueryString(query, 'sort') ?? 'recommended',
  };

  const queryText = parseQueryString(query, 'query');
  if (queryText) {
    payload.query = queryText;
  }

  const propertyType = parseQueryString(query, 'propertyType');
  if (propertyType) {
    payload.property_type = propertyType;
  }

  const checkIn = parseQueryString(query, 'checkIn');
  if (checkIn) {
    payload.check_in = checkIn;
  }

  const checkOut = parseQueryString(query, 'checkOut');
  if (checkOut) {
    payload.check_out = checkOut;
  }

  const guests = parseQueryNumber(query, 'guests');
  if (guests != null) {
    payload.guests = guests;
  }

  const priceMin = parseQueryNumber(query, 'priceMin');
  if (priceMin != null) {
    payload.price_min = priceMin;
  }

  const priceMax = parseQueryNumber(query, 'priceMax');
  if (priceMax != null) {
    payload.price_max = priceMax;
  }

  const centerLat = parseQueryNumber(query, 'centerLat');
  if (centerLat != null) {
    payload.center_lat = centerLat;
  }

  const centerLng = parseQueryNumber(query, 'centerLng');
  if (centerLng != null) {
    payload.center_lng = centerLng;
  }

  const north = parseQueryNumber(query, 'north');
  const south = parseQueryNumber(query, 'south');
  const east = parseQueryNumber(query, 'east');
  const west = parseQueryNumber(query, 'west');
  if (north != null && south != null && east != null && west != null) {
    payload.north = north;
    payload.south = south;
    payload.east = east;
    payload.west = west;
  }

  const amenitySlugs = parseQueryArray(query, 'amenitySlugs');
  if (amenitySlugs.length > 0) {
    payload.amenity_slugs = amenitySlugs;
  }

  const maxStationWalkMin = parseQueryNumber(query, 'maxStationWalkMin');
  if (maxStationWalkMin != null) {
    payload.max_station_walk_min = maxStationWalkMin;
  }

  const excludePropertyIds = parseQueryArray(query, 'excludePropertyIds');
  if (excludePropertyIds.length > 0) {
    payload.exclude_property_ids = excludePropertyIds;
  }

  return payload;
}

export function requireQueryString(
  query: Record<string, QueryValue | QueryValue[] | null | undefined>,
  key: string,
): string {
  const value = parseQueryString(query, key);
  if (!value) {
    throw new AppError('INVALID_INPUT', `Missing query param: ${key}.`);
  }
  return value;
}

export function requirePathParam(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new AppError('INVALID_INPUT', `Missing path param: ${key}.`);
  }
  return value;
}

export async function requireAuthenticatedUser(
  client: SupabaseClient<Database>,
): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to verify authentication');
  }

  if (!user) {
    throw new AppError('AUTH_REQUIRED', 'Authentication required');
  }

  return user.id;
}

export async function requireHostId(client: SupabaseClient<Database>): Promise<string> {
  const userId = await requireAuthenticatedUser(client);

  const { data, error } = await client
    .from('hosts')
    .select('id')
    .eq('profile_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load host profile');
  }

  if (!data) {
    throw new AppError('FORBIDDEN', 'Host profile is required before creating listings');
  }

  return data.id;
}

export function extractInlineFunctionError(data: unknown): string | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    return (data as ApiErrorResponse).error.message;
  }

  return null;
}

export async function parseEdgeFunctionError(
  error: unknown,
  fallbackCode: 'API_ERROR' | 'PAYMENT_FAILED',
  fallbackMessage: string,
): Promise<AppError> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;
      if (payload.error?.message) {
        return new AppError(fallbackCode, payload.error.message, { cause: error });
      }
    } catch {
      return new AppError(fallbackCode, fallbackMessage, { cause: error });
    }
  }

  const appError = AppError.from(error, fallbackCode);
  if (appError.message === 'An unexpected error occurred') {
    return new AppError(fallbackCode, fallbackMessage, { cause: error });
  }

  return appError;
}
