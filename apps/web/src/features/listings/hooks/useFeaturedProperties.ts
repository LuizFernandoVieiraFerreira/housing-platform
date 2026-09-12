import { useQuery } from '@tanstack/react-query';

import { fetchFeaturedProperties } from '../api/properties-api';
import { listingsKeys } from '../keys';

export function useFeaturedProperties() {
  return useQuery({
    queryKey: listingsKeys.featured(),
    queryFn: fetchFeaturedProperties,
    staleTime: 60_000,
  });
}
