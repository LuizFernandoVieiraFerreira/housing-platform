import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryKeys } from '@/shared/api/query-keys';
import { supabase } from '@/shared/api/supabase';

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const activeUserId = userId;

    function invalidateNotifications() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(activeUserId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(activeUserId),
      });
    }

    const channel = supabase
      .channel(`notifications:${activeUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${activeUserId}`,
        },
        invalidateNotifications,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${activeUserId}`,
        },
        invalidateNotifications,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
