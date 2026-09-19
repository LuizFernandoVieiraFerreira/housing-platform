import { registerApiRoute } from '@/shared/api/client';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { Notification, NotificationRow } from '../model';
import { mapNotificationRow } from './mappers';

export const fetchNotifications = registerApiRoute<Notification[]>(
  'notifications',
  'GET',
  '/notifications',
  async ({ client }) => {
    const { data, error } = await client
      .from('notifications')
      .select('id, user_id, type, title, body, metadata, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load notifications');
    }

    return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
  },
);

export const fetchUnreadNotificationCount = registerApiRoute<number>(
  'notifications',
  'GET',
  '/notifications/unread-count',
  async ({ client }) => {
    const { data, error } = await client.rpc('get_unread_notification_count');

    if (error) {
      throw wrapSupabaseError(error, 'Unable to check notifications');
    }

    return (data as number) ?? 0;
  },
);

const markNotificationReadRequest = registerApiRoute<Notification>(
  'notifications',
  'POST',
  '/notifications/:id/read',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('mark_notification_read', {
      p_notification_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to mark notification as read');
    }

    return mapNotificationRow(data as NotificationRow);
  },
);

export function markNotificationRead(notificationId: string): Promise<Notification> {
  return markNotificationReadRequest({ params: { id: notificationId } });
}

export const markAllNotificationsRead = registerApiRoute<number>(
  'notifications',
  'POST',
  '/notifications/read-all',
  async ({ client }) => {
    const { data, error } = await client.rpc('mark_all_notifications_read');

    if (error) {
      throw wrapSupabaseError(error, 'Unable to mark notifications as read');
    }

    return (data as number) ?? 0;
  },
);
