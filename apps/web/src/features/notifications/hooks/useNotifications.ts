import { useQuery } from '@tanstack/react-query';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
} from '../api/notifications-api';
import { useAuth } from '@/features/auth';
import { notificationKeys } from '../keys';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}
