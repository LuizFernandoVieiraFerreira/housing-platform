import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Profile } from '@housing-platform/types';

import { fetchCurrentProfile, updateCurrentProfile } from '@/features/account/api/profile-api';
import { queryKeys } from '@/shared/api/query-keys';

export function useCurrentProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.current(userId ?? 'anonymous'),
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      return fetchCurrentProfile(userId);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useUpdateProfileMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Pick<
        Profile,
        'full_name' | 'phone' | 'avatar_url' | 'preferred_language' | 'marketing_consent'
      >,
    ) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      return updateCurrentProfile(userId, input);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.current(userId ?? 'anonymous'), profile);
    },
  });
}
