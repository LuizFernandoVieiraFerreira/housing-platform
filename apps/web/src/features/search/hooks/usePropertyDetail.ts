import { useQuery } from '@tanstack/react-query';

import { fetchPropertyDetail } from '@/features/search/api/search-api';
import { queryKeys } from '@/shared/api/query-keys';

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.properties.detail(propertyId ?? 'unknown'),
    queryFn: () => {
      if (!propertyId) {
        throw new Error('Property ID is required');
      }

      return fetchPropertyDetail(propertyId);
    },
    enabled: Boolean(propertyId),
    staleTime: 300_000,
  });
}
