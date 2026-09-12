import { useQuery } from '@tanstack/react-query';

import { fetchPropertyDetail } from '../api/search-api';
import { searchKeys } from '../keys';

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: searchKeys.detail(propertyId ?? 'unknown'),
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
