import { useQuery } from '@tanstack/react-query';

import { fetchFeaturedProperties } from '@/features/listings/api/properties-api';
import { queryKeys } from '@/shared/api/query-keys';

export function useFeaturedProperties() {
  return useQuery({
    queryKey: queryKeys.properties.featured,
    queryFn: fetchFeaturedProperties,
    staleTime: 60_000,
  });
}
