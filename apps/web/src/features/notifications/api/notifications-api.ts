import type { Notification, NotificationType } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, metadata, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');

  if (error) {
    throw error;
  }

  return (data as number) ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });

  if (error) {
    throw error;
  }

  return mapNotificationRow(data as NotificationRow);
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');

  if (error) {
    throw error;
  }

  return (data as number) ?? 0;
}
