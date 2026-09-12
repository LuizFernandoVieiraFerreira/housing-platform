import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications-api';
import { useAuth } from '@/features/auth';
import { notificationKeys } from '../keys';

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  function invalidateNotifications() {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
    void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
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
