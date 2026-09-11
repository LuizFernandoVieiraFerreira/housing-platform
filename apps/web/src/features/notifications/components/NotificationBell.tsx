import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

import { useUnreadNotificationCount } from '@/features/notifications/hooks/useNotifications';

function formatBadgeCount(count: number): string {
  if (count > 9) {
    return '9+';
  }

  return String(count);
}

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  return (
    <Link
      to="/notifications"
      className="text-ink-muted hover:text-ink hover:bg-surface-muted relative hidden rounded-full p-2 transition-colors md:block"
      aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <Bell size={20} />
      {hasUnread ? (
        <span className="bg-brand-600 absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white">
          {formatBadgeCount(unreadCount)}
        </span>
      ) : null}
    </Link>
  );
}
