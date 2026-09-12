import type { AiPropertySearchRequest } from '@housing-platform/types';
import { useQuery } from '@tanstack/react-query';

import { aiPropertySearch } from '../api/ai-search-api';
import { SEARCH_RESULTS_PAGE_SIZE } from '../lib/search-config';
import { searchKeys } from '../keys';

export function useAiPropertySearch(request: AiPropertySearchRequest | null) {
  const enabled = Boolean(request?.query?.trim() || request?.referencePropertyId);

  return useQuery({
    queryKey: searchKeys.aiSearch(
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
