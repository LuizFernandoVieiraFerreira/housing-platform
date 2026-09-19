import { registerSupabaseRoute } from '../supabase-adapter';
import { assertNoSupabaseError, requirePathParam } from './helpers';

export const NOTIFICATION_ROUTES = [
  { method: 'GET' as const, path: '/notifications' },
  { method: 'GET' as const, path: '/notifications/unread-count' },
  { method: 'POST' as const, path: '/notifications/:id/read' },
  { method: 'POST' as const, path: '/notifications/read-all' },
];

export function registerNotificationRoutes(): void {
  registerSupabaseRoute('GET', '/notifications', async ({ client }) => {
    const { data, error } = await client
      .from('notifications')
      .select('id, user_id, type, title, body, metadata, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    assertNoSupabaseError(error, 'Unable to load notifications');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/notifications/unread-count', async ({ client }) => {
    const { data, error } = await client.rpc('get_unread_notification_count');

    assertNoSupabaseError(error, 'Unable to check notifications');
    return (data as number) ?? 0;
  });

  registerSupabaseRoute('POST', '/notifications/:id/read', async ({ client, params }) => {
    const { data, error } = await client.rpc('mark_notification_read', {
      p_notification_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to mark notification as read');
    return data;
  });

  registerSupabaseRoute('POST', '/notifications/read-all', async ({ client }) => {
    const { data, error } = await client.rpc('mark_all_notifications_read');

    assertNoSupabaseError(error, 'Unable to mark notifications as read');
    return (data as number) ?? 0;
  });
}
