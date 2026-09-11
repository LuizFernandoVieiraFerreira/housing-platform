import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

import { createEmbedding, embeddingToVectorLiteral, extractSearchIntentUsingLlm } from './openai.ts';

export type AccommodationType = 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom';

export type PropertySearchSort = 'recommended' | 'price_asc' | 'price_desc' | 'distance' | 'semantic';

export interface AiSearchContext {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  mapCenterLat?: number;
  mapCenterLng?: number;
}

export interface ExtractedSearchIntent {
  property_type: AccommodationType | null;
  price_min: number | null;
  price_max: number | null;
  check_in: string | null;
  check_out: string | null;
  stay_months: number | null;
  guests: number | null;
  amenity_slugs: string[];
  max_station_walk_min: number | null;
  location_phrase: string | null;
  district: string | null;
  sort: PropertySearchSort | null;
  semantic_query: string | null;
  cheaper_than_reference: boolean;
}

export interface PropertySearchFilters {
  query?: string;
  propertyType?: AccommodationType;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: PropertySearchSort;
  centerLat?: number;
  centerLng?: number;
  amenitySlugs?: string[];
  maxStationWalkMin?: number;
  excludePropertyIds?: string[];
}

export interface LocationAliasMatch {
  alias: string;
  district: string;
  center_lat: number;
  center_lng: number;
}

const AMENITY_KEYWORDS: Record<string, string[]> = {
  'washing-machine': ['washing machine', 'washer', 'laundry'],
  wifi: ['wifi', 'wi-fi', 'internet'],
  desk: ['desk', 'workspace', 'work from home', 'remote work', 'wfh'],
  kitchen: ['kitchen'],
  parking: ['parking', 'car park'],
  'air-conditioning': ['air conditioning', 'aircon', 'a/c', 'ac'],
  elevator: ['elevator', 'lift'],
  balcony: ['balcony', 'terrace'],
  heating: ['heating', 'heated'],
};

const LOCATION_KEYWORDS = [
  'hongdae',
  'gangnam',
  'itaewon',
  'myeongdong',
  'jamsil',
  'sinchon',
  'yeouido',
  'seongsu',
  'snu',
  'dongdaemun',
  'hapjeong',
  'mangwon',
  'apgujeong',
  'nowon',
  'cheongnyangni',
  'hannam',
  'insadong',
  'gwangjin',
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function parseKrwAmount(raw: string, unit: string): number | null {
  const amount = Number(raw.replace(/,/g, ''));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (unit === 'm' || unit === 'million') {
    return Math.round(amount * 1_000_000);
  }

  if (unit === 'k') {
    return Math.round(amount * 1_000);
  }

  return Math.round(amount);
}

function extractPriceMax(query: string): number | null {
  const millionMatch = query.match(/(?:under|below|max|up to|<=?)\s*₩?\s*(\d+(?:\.\d+)?)\s*(m|million|mil)\b/i);
  if (millionMatch) {
    return parseKrwAmount(millionMatch[1], millionMatch[2]);
  }

  const wonMatch = query.match(
    /(?:under|below|max|up to|<=?)\s*₩?\s*(\d[\d,]*)\s*(?:won|krw)?\b/i,
  );
  if (wonMatch) {
    return parseKrwAmount(wonMatch[1], 'won');
  }

  const cheapMatch = query.match(/\b(cheap|budget|affordable)\b/i);
  if (cheapMatch) {
    return 700_000;
  }

  return null;
}

function extractPropertyType(query: string): AccommodationType | null {
  if (/\bmicro[- ]studio\b/i.test(query)) {
    return 'micro-studio';
  }

  if (/\bshare[- ]house\b/i.test(query)) {
    return 'share-house';
  }

  if (/\bmulti[- ]bed(room)?\b/i.test(query)) {
    return 'multi-bedroom';
  }

  if (/\bstudio\b/i.test(query)) {
    return 'studio';
  }

  return null;
}

function extractStayMonths(query: string): number | null {
  const match = query.match(/\bfor\s+(\d+)\s+months?\b/i);
  return match ? Number(match[1]) : null;
}

function extractGuests(query: string): number | null {
  const match = query.match(/\bfor\s+(\d+)\s+(guests?|people|persons?)\b/i);
  return match ? Number(match[1]) : null;
}

function extractAmenitySlugs(query: string): string[] {
  const normalized = normalizeText(query);
  const slugs = new Set<string>();

  for (const [slug, keywords] of Object.entries(AMENITY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      slugs.add(slug);
    }
  }

  return [...slugs];
}

function extractLocationPhrase(query: string): string | null {
  const normalized = normalizeText(query);

  for (const location of LOCATION_KEYWORDS) {
    if (normalized.includes(location)) {
      return location.charAt(0).toUpperCase() + location.slice(1);
    }
  }

  const nearMatch = query.match(/\bnear\s+([a-z0-9 .-]{2,40})/i);
  if (nearMatch) {
    return nearMatch[1].trim();
  }

  const inMatch = query.match(/\bin\s+([a-z0-9 .-]{2,40})/i);
  if (inMatch) {
    return inMatch[1].trim();
  }

  return null;
}

function extractSemanticQuery(query: string, intent: Partial<ExtractedSearchIntent>): string | null {
  const normalized = normalizeText(query);

  if (/\b(remote work|work from home|wfh|quiet|student|family|nightlife|similar)\b/i.test(normalized)) {
    if (intent.amenity_slugs?.includes('desk') && intent.amenity_slugs.includes('wifi')) {
      return 'good for remote work with desk and wifi';
    }

    if (/\bquiet\b/i.test(normalized)) {
      return 'quiet place suitable for focused stay';
    }

    if (/\bstudent\b/i.test(normalized)) {
      return 'student friendly affordable stay';
    }

    if (/\bfamily\b/i.test(normalized)) {
      return 'family friendly spacious stay';
    }

    if (/\bnightlife\b/i.test(normalized)) {
      return 'lively area with nightlife nearby';
    }
  }

  return null;
}

export function extractSearchIntentHeuristic(query: string): ExtractedSearchIntent {
  const normalized = normalizeText(query);
  const amenitySlugs = extractAmenitySlugs(normalized);
  const locationPhrase = extractLocationPhrase(query);
  const semanticQuery = extractSemanticQuery(query, { amenity_slugs: amenitySlugs });

  return {
    property_type: extractPropertyType(query),
    price_min: null,
    price_max: extractPriceMax(query),
    check_in: null,
    check_out: null,
    stay_months: extractStayMonths(query),
    guests: extractGuests(query),
    amenity_slugs: amenitySlugs,
    max_station_walk_min: /\bnear (a |the )?subway|subway station|close to (a |the )?station\b/i.test(
        normalized,
      )
      ? 10
      : null,
    location_phrase: locationPhrase,
    district: null,
    sort: semanticQuery ? 'semantic' : 'recommended',
    semantic_query: semanticQuery,
    cheaper_than_reference: /\b(cheaper|lower price|less expensive)\b/i.test(normalized),
  };
}

export async function extractSearchIntent(
  query: string,
  options: { useDevMock: boolean },
): Promise<{ intent: ExtractedSearchIntent; usedLlm: boolean }> {
  if (options.useDevMock) {
    return { intent: extractSearchIntentHeuristic(query), usedLlm: false };
  }

  try {
    const intent = await extractSearchIntentUsingLlm(query);
    return { intent, usedLlm: true };
  } catch {
    return { intent: extractSearchIntentHeuristic(query), usedLlm: false };
  }
}

export async function resolveLocationAlias(
  serviceClient: SupabaseClient,
  phrase: string | null,
): Promise<LocationAliasMatch | null> {
  if (!phrase?.trim()) {
    return null;
  }

  const trimmed = phrase.trim();

  const { data: exactMatch } = await serviceClient
    .from('location_aliases')
    .select('alias, district, center_lat, center_lng')
    .ilike('alias', trimmed)
    .limit(1)
    .maybeSingle();

  if (exactMatch) {
    return exactMatch as LocationAliasMatch;
  }

  const { data: fuzzyMatches } = await serviceClient
    .from('location_aliases')
    .select('alias, district, center_lat, center_lng')
    .ilike('alias', `%${trimmed}%`)
    .limit(1);

  return (fuzzyMatches?.[0] as LocationAliasMatch | undefined) ?? null;
}

function addDays(base: Date, days: number): string {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function addMonths(base: Date, months: number): string {
  const next = new Date(base);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

export function mergeIntentWithContext(
  intent: ExtractedSearchIntent,
  context?: AiSearchContext,
): ExtractedSearchIntent {
  const merged = { ...intent };

  if (context?.guests != null) {
    merged.guests = context.guests;
  }

  if (context?.checkIn) {
    merged.check_in = context.checkIn;
  }

  if (context?.checkOut) {
    merged.check_out = context.checkOut;
  }

  if (!merged.check_in && merged.stay_months != null) {
    const checkInBase = addDays(new Date(), 14);
    merged.check_in = checkInBase;
    merged.check_out = addMonths(new Date(`${checkInBase}T00:00:00Z`), merged.stay_months);
  }

  return merged;
}

export function buildPropertySearchFilters(
  intent: ExtractedSearchIntent,
  location: LocationAliasMatch | null,
  context?: AiSearchContext,
  options?: {
    referencePropertyId?: string;
    referenceMonthlyPriceMin?: number | null;
  },
): PropertySearchFilters {
  const filters: PropertySearchFilters = {
    guests: intent.guests ?? context?.guests ?? 1,
    sort: intent.sort ?? (intent.semantic_query ? 'semantic' : 'recommended'),
  };

  if (intent.property_type) {
    filters.propertyType = intent.property_type;
  }

  if (intent.price_min != null) {
    filters.priceMin = intent.price_min;
  }

  if (intent.price_max != null) {
    filters.priceMax = intent.price_max;
  }

  if (intent.check_in) {
    filters.checkIn = intent.check_in;
  }

  if (intent.check_out) {
    filters.checkOut = intent.check_out;
  }

  if (location) {
    filters.centerLat = location.center_lat;
    filters.centerLng = location.center_lng;
    filters.query = location.alias;
  } else if (intent.location_phrase) {
    filters.query = intent.location_phrase;
  } else if (intent.district) {
    filters.query = intent.district;
  }

  if (context?.mapCenterLat != null && context.mapCenterLng != null && !location) {
    filters.centerLat = context.mapCenterLat;
    filters.centerLng = context.mapCenterLng;
  }

  if (intent.amenity_slugs.length > 0) {
    filters.amenitySlugs = intent.amenity_slugs;
  }

  if (intent.max_station_walk_min != null) {
    filters.maxStationWalkMin = intent.max_station_walk_min;
  }

  if (options?.referencePropertyId) {
    filters.excludePropertyIds = [options.referencePropertyId];

    if (
      options.referenceMonthlyPriceMin != null &&
      (intent.cheaper_than_reference || intent.price_max == null)
    ) {
      filters.priceMax = Math.min(
        filters.priceMax ?? options.referenceMonthlyPriceMin - 1,
        options.referenceMonthlyPriceMin - 1,
      );
    }
  }

  return filters;
}

export function filtersToRpcPayload(
  filters: PropertySearchFilters,
  referencePropertyId?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sort: filters.sort ?? 'recommended',
  };

  if (filters.query) payload.query = filters.query;
  if (filters.propertyType) payload.property_type = filters.propertyType;
  if (filters.checkIn) payload.check_in = filters.checkIn;
  if (filters.checkOut) payload.check_out = filters.checkOut;
  if (filters.guests != null) payload.guests = filters.guests;
  if (filters.priceMin != null) payload.price_min = filters.priceMin;
  if (filters.priceMax != null) payload.price_max = filters.priceMax;
  if (filters.centerLat != null) payload.center_lat = filters.centerLat;
  if (filters.centerLng != null) payload.center_lng = filters.centerLng;
  if (filters.amenitySlugs?.length) payload.amenity_slugs = filters.amenitySlugs;
  if (filters.maxStationWalkMin != null) {
    payload.max_station_walk_min = filters.maxStationWalkMin;
  }
  if (filters.excludePropertyIds?.length) {
    payload.exclude_property_ids = filters.excludePropertyIds;
  }
  if (referencePropertyId) {
    payload.reference_property_id = referencePropertyId;
  }

  return payload;
}

export async function createQueryEmbedding(semanticQuery: string | null): Promise<string | null> {
  if (!semanticQuery?.trim()) {
    return null;
  }

  const embedding = await createEmbedding(semanticQuery);
  return embeddingToVectorLiteral(embedding);
}

export function buildSearchExplanation(
  filters: PropertySearchFilters,
  totalCount: number,
  fallbackUsed: boolean,
): string {
  const parts: string[] = [];

  if (filters.propertyType) {
    parts.push(filters.propertyType.replace('-', ' '));
  }

  if (filters.query) {
    parts.push(`near ${filters.query}`);
  }

  if (filters.priceMax != null) {
    parts.push(`under ₩${filters.priceMax.toLocaleString('en-US')}/mo`);
  }

  if (filters.amenitySlugs?.length) {
    parts.push(`with ${filters.amenitySlugs.join(', ')}`);
  }

  if (filters.maxStationWalkMin != null) {
    parts.push(`within ${filters.maxStationWalkMin} min of a station`);
  }

  const summary =
    parts.length > 0
      ? `Found ${totalCount} stay${totalCount === 1 ? '' : 's'} matching ${parts.join(', ')}.`
      : `Found ${totalCount} stay${totalCount === 1 ? '' : 's'}.`;

  if (fallbackUsed) {
    return `${summary} Used keyword search because AI parsing was unavailable.`;
  }

  return summary;
}
