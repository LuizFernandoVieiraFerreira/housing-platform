import type { AiPropertySearchRequest } from '@housing-platform/types';
import { useQuery } from '@tanstack/react-query';

import { aiPropertySearch } from '@/features/search/api/ai-search-api';
import { SEARCH_RESULTS_PAGE_SIZE } from '@/features/search/lib/search-config';
import { queryKeys } from '@/shared/api/query-keys';

export function useAiPropertySearch(request: AiPropertySearchRequest | null) {
  const enabled = Boolean(request?.query?.trim() || request?.referencePropertyId);

  return useQuery({
    queryKey: queryKeys.properties.aiSearch(
      request
        ? {
            query: request.query ?? '',
            referencePropertyId: request.referencePropertyId ?? '',
            context: request.context ?? {},
            limit: request.limit ?? SEARCH_RESULTS_PAGE_SIZE,
          }
        : null,
    ),
    queryFn: () => aiPropertySearch(request as AiPropertySearchRequest),
    enabled,
    staleTime: 30_000,
  });
}
