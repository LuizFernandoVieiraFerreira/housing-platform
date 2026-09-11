import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api/notifications-api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryKeys } from '@/shared/api/query-keys';

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  function invalidateNotifications() {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
  }

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidateNotifications,
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidateNotifications,
  });

  return {
    markRead,
    markAllRead,
  };
}
