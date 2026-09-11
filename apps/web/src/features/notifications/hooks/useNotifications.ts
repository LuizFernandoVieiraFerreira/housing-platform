import { useQuery } from '@tanstack/react-query';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
} from '@/features/notifications/api/notifications-api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryKeys } from '@/shared/api/query-keys';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId),
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}
