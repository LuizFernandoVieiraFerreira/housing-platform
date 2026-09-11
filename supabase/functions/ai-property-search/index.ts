import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { captureException } from '../_shared/logger.ts';
import { isOpenAiConfigured } from '../_shared/openai.ts';
import { enforceRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import {
  buildPropertySearchFilters,
  buildSearchExplanation,
  createQueryEmbedding,
  extractSearchIntent,
  filtersToRpcPayload,
  mergeIntentWithContext,
  resolveLocationAlias,
  type AiSearchContext,
} from '../_shared/search-intent.ts';
import {
  createServiceClient,
  createUserClient,
  getAuthenticatedUser,
} from '../_shared/supabase.ts';

interface AiPropertySearchBody {
  query?: string;
  referencePropertyId?: string;
  context?: AiSearchContext;
  limit?: number;
}

type SearchPropertyRow = {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  district: string;
  nearest_station_name: string | null;
  monthly_price_min: number;
  tags: string[] | null;
  cover_storage_path: string | null;
  cover_alt_text: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number | null;
  total_count: number;
};

function isAiSearchDevMockEnabled(): boolean {
  return (Deno.env.get('AI_SEARCH_DEV_MOCK') ?? '').trim().toLowerCase() === 'true';
}

function mapSearchProperty(row: SearchPropertyRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    tags: row.tags ?? [],
    coverImageUrl: null,
    coverImageStoragePath: row.cover_storage_path,
    coverImageAlt: row.cover_alt_text,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distance_meters,
  };
}

async function runFallbackSearch(
  userClient: ReturnType<typeof createUserClient>,
  query: string,
  limit: number,
) {
  const { data, error } = await userClient.rpc('search_properties_hybrid', {
    p_filters: { query: query.trim() },
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SearchPropertyRow[];

  return {
    items: rows.map(mapSearchProperty),
    totalCount: rows[0]?.total_count ?? 0,
    interpretedFilters: { query: query.trim(), guests: 1, sort: 'recommended' as const },
    explanation: `Found ${rows[0]?.total_count ?? 0} stays using keyword search.`,
    fallbackUsed: true,
  };
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'ai-property-search',
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs);
  }

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed', 405);
  }

  try {
    const body = (await req.json()) as AiPropertySearchBody;
    const query = body.query?.trim() ?? '';
    const referencePropertyId = body.referencePropertyId?.trim() || undefined;
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

    if (!query && !referencePropertyId) {
      return errorResponse('VALIDATION_ERROR', 'Provide query or referencePropertyId', 400);
    }

    if (query.length > 500) {
      return errorResponse('VALIDATION_ERROR', 'Query must be at most 500 characters', 400);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    await getAuthenticatedUser(req);
    const userClient = createUserClient(authHeader);
    const serviceClient = createServiceClient();

    if (!query && referencePropertyId) {
      const { data: referenceProperty, error: referenceError } = await userClient
        .from('properties')
        .select('id, title, monthly_price_min')
        .eq('id', referencePropertyId)
        .eq('status', 'published')
        .maybeSingle();

      if (referenceError || !referenceProperty) {
        return errorResponse('NOT_FOUND', 'Reference property not found', 404);
      }

      const filters = buildPropertySearchFilters(
        {
          property_type: null,
          price_min: null,
          price_max: referenceProperty.monthly_price_min
            ? referenceProperty.monthly_price_min - 1
            : null,
          check_in: null,
          check_out: null,
          stay_months: null,
          guests: body.context?.guests ?? 1,
          amenity_slugs: [],
          max_station_walk_min: null,
          location_phrase: null,
          district: null,
          sort: 'semantic',
          semantic_query: 'similar furnished monthly stay',
          cheaper_than_reference: true,
        },
        null,
        body.context,
        {
          referencePropertyId,
          referenceMonthlyPriceMin: referenceProperty.monthly_price_min,
        },
      );

      const { data, error } = await userClient.rpc('search_properties_hybrid', {
        p_filters: filtersToRpcPayload(filters, referencePropertyId),
        p_limit: limit,
        p_offset: 0,
        p_match_threshold: 0.45,
      });

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as SearchPropertyRow[];

      return jsonResponse({
        items: rows.map(mapSearchProperty),
        totalCount: rows[0]?.total_count ?? 0,
        interpretedFilters: filters,
        explanation: `Similar stays priced below ${referenceProperty.title}.`,
        fallbackUsed: false,
      });
    }

    const useDevMock = isAiSearchDevMockEnabled() || !isOpenAiConfigured();
    const { intent: extractedIntent, usedLlm } = await extractSearchIntent(query, { useDevMock });
    const intent = mergeIntentWithContext(extractedIntent, body.context);
    const location = await resolveLocationAlias(serviceClient, intent.location_phrase);

    let referenceMonthlyPriceMin: number | null = null;

    if (referencePropertyId) {
      const { data: referenceProperty, error: referenceError } = await userClient
        .from('properties')
        .select('monthly_price_min')
        .eq('id', referencePropertyId)
        .eq('status', 'published')
        .maybeSingle();

      if (referenceError || !referenceProperty) {
        return errorResponse('NOT_FOUND', 'Reference property not found', 404);
      }

      referenceMonthlyPriceMin = referenceProperty.monthly_price_min;
    }

    const interpretedFilters = buildPropertySearchFilters(intent, location, body.context, {
      referencePropertyId,
      referenceMonthlyPriceMin,
    });

    let queryEmbedding: string | null = null;
    let fallbackUsed = !usedLlm;

    if (intent.semantic_query) {
      try {
        queryEmbedding = await createQueryEmbedding(intent.semantic_query);
      } catch {
        fallbackUsed = true;
      }
    }

    const rpcPayload = filtersToRpcPayload(interpretedFilters, referencePropertyId);

    let rows: SearchPropertyRow[] = [];
    let searchError: Error | null = null;

    const searchAttempt = async (embedding: string | null, threshold: number) => {
      const { data, error } = await userClient.rpc('search_properties_hybrid', {
        p_filters: rpcPayload,
        p_limit: limit,
        p_offset: 0,
        p_query_embedding: embedding,
        p_match_threshold: threshold,
      });

      if (error) {
        throw error;
      }

      return (data ?? []) as SearchPropertyRow[];
    };

    try {
      rows = await searchAttempt(queryEmbedding, 0.55);

      if (rows.length === 0 && queryEmbedding) {
        rows = await searchAttempt(queryEmbedding, 0.45);
      }

      if (rows.length === 0 && queryEmbedding) {
        rows = await searchAttempt(null, 0.55);
        fallbackUsed = true;
      }
    } catch (error) {
      searchError = error instanceof Error ? error : new Error('Search failed');
    }

    if (searchError) {
      return jsonResponse(await runFallbackSearch(userClient, query, limit));
    }

    const totalCount = rows[0]?.total_count ?? 0;
    const explanation = buildSearchExplanation(interpretedFilters, totalCount, fallbackUsed);

    return jsonResponse({
      items: rows.map(mapSearchProperty),
      totalCount,
      interpretedFilters,
      explanation,
      fallbackUsed,
    });
  } catch (error) {
    await captureException(error, { function: 'ai-property-search' });
    return errorResponse('INTERNAL_ERROR', 'Unable to run AI property search', 500);
  }
});
