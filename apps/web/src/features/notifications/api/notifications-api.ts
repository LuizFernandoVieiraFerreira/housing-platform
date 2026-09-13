import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { Notification, NotificationRow } from '../model';
import { mapNotificationRow } from './mappers';

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, metadata, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load notifications');
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');

  if (error) {
    throw wrapSupabaseError(error, 'Unable to check notifications');
  }

  return (data as number) ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to mark notification as read');
  }

  return mapNotificationRow(data as NotificationRow);
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');

  if (error) {
    throw wrapSupabaseError(error, 'Unable to mark notifications as read');
  }

  return (data as number) ?? 0;
}
