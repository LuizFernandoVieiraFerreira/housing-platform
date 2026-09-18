import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api/notifications-api';

const notificationRow = {
  id: 'notif-1',
  user_id: 'user-1',
  type: 'booking_confirmed' as const,
  title: 'Booking confirmed',
  body: 'Your stay is confirmed.',
  metadata: { bookingId: 'booking-1' },
  read_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('notifications-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  describe('fetchNotifications', () => {
    it('maps notification rows to domain models', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [notificationRow], error: null }),
          }),
        }),
      });

      const notifications = await fetchNotifications();

      expect(notifications).toEqual([
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'booking_confirmed',
          title: 'Booking confirmed',
          body: 'Your stay is confirmed.',
          metadata: { bookingId: 'booking-1' },
          readAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('fetchUnreadNotificationCount', () => {
    it('returns rpc count', async () => {
      rpcMock.mockResolvedValue({ data: 3, error: null });

      await expect(fetchUnreadNotificationCount()).resolves.toBe(3);
      expect(rpcMock).toHaveBeenCalledWith('get_unread_notification_count');
    });

    it('defaults to zero when rpc returns null', async () => {
      rpcMock.mockResolvedValue({ data: null, error: null });

      await expect(fetchUnreadNotificationCount()).resolves.toBe(0);
    });
  });

  describe('markNotificationRead', () => {
    it('maps rpc response', async () => {
      rpcMock.mockResolvedValue({
        data: { ...notificationRow, read_at: '2026-01-02T00:00:00.000Z' },
        error: null,
      });

      const notification = await markNotificationRead('notif-1');

      expect(notification.readAt).toBe('2026-01-02T00:00:00.000Z');
      expect(rpcMock).toHaveBeenCalledWith('mark_notification_read', {
        p_notification_id: 'notif-1',
      });
    });
  });

  describe('markAllNotificationsRead', () => {
    it('returns updated count from rpc', async () => {
      rpcMock.mockResolvedValue({ data: 5, error: null });

      await expect(markAllNotificationsRead()).resolves.toBe(5);
      expect(rpcMock).toHaveBeenCalledWith('mark_all_notifications_read');
    });
  });
});
