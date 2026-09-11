import type {
  AiPropertySearchRequest,
  AiPropertySearchResponse,
  ApiErrorResponse,
  SearchPropertyCard,
} from '@housing-platform/types';

import { mapSearchProperty } from '@/features/search/api/search-api';
import { supabase } from '@/shared/api/supabase';

type AiSearchPropertyRow = {
  id: string;
  title: string;
  slug: string;
  propertyType: SearchPropertyCard['propertyType'];
  district: string;
  nearestStationName: string | null;
  monthlyPriceMin: number;
  tags: string[] | null;
  coverImageUrl: string | null;
  coverImageStoragePath?: string | null;
  coverImageAlt: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
};

type AiSearchFunctionResponse = {
  items: AiSearchPropertyRow[];
  totalCount: number;
  interpretedFilters: AiPropertySearchResponse['interpretedFilters'];
  explanation?: string;
  fallbackUsed?: boolean;
};

async function readFunctionError(error: unknown, fallback: string): Promise<Error> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;

      if (payload.error?.message) {
        return new Error(payload.error.message);
      }
    } catch {
      return error instanceof Error ? error : new Error(fallback);
    }
  }

  return error instanceof Error ? error : new Error(fallback);
}

function mapAiSearchItem(item: AiSearchPropertyRow): SearchPropertyCard {
  if (item.coverImageUrl) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      propertyType: item.propertyType,
      district: item.district,
      nearestStationName: item.nearestStationName,
      monthlyPriceMin: item.monthlyPriceMin,
      coverImageUrl: item.coverImageUrl,
      coverImageAlt: item.coverImageAlt,
      tags: item.tags ?? [],
      latitude: item.latitude,
      longitude: item.longitude,
      distanceMeters: item.distanceMeters,
    };
  }

  return mapSearchProperty({
    id: item.id,
    title: item.title,
    slug: item.slug,
    property_type: item.propertyType,
    district: item.district,
    nearest_station_name: item.nearestStationName,
    monthly_price_min: item.monthlyPriceMin,
    tags: item.tags,
    cover_storage_path: item.coverImageStoragePath ?? null,
    cover_alt_text: item.coverImageAlt,
    latitude: item.latitude,
    longitude: item.longitude,
    distance_meters: item.distanceMeters,
    total_count: 0,
  });
}

export async function aiPropertySearch(
  request: AiPropertySearchRequest,
): Promise<AiPropertySearchResponse> {
  const { data, error } = await supabase.functions.invoke('ai-property-search', {
    body: request,
  });

  if (error) {
    throw await readFunctionError(error, 'Unable to run smart search.');
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    throw new Error((data as ApiErrorResponse).error.message);
  }

  const payload = data as AiSearchFunctionResponse;

  return {
    items: (payload.items ?? []).map(mapAiSearchItem),
    totalCount: payload.totalCount ?? 0,
    interpretedFilters: payload.interpretedFilters ?? {},
    explanation: payload.explanation,
    fallbackUsed: payload.fallbackUsed,
  };
}
