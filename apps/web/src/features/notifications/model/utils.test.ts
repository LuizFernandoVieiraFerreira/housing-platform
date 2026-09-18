import { describe, expect, it } from 'vitest';

import type { Notification } from '@/features/notifications/model';
import {
  filterUnreadNotifications,
  isBookingNotification,
  isUnreadNotification,
} from '@/features/notifications/model/utils';

const notification: Notification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'booking_confirmed',
  title: 'Confirmed',
  body: 'Your booking is confirmed.',
  metadata: {},
  readAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('notifications model utils', () => {
  it('detects unread notifications', () => {
    expect(isUnreadNotification(notification)).toBe(true);
    expect(isUnreadNotification({ ...notification, readAt: '2026-01-02T00:00:00.000Z' })).toBe(
      false,
    );
  });

  it('filters unread notifications', () => {
    const unread = filterUnreadNotifications([
      notification,
      { ...notification, id: 'notif-2', readAt: '2026-01-02T00:00:00.000Z' },
    ]);

    expect(unread).toHaveLength(1);
    expect(unread[0]?.id).toBe('notif-1');
  });

  it('detects booking notification types', () => {
    expect(isBookingNotification(notification)).toBe(true);
  });
});
