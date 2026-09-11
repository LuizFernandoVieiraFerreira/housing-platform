import { EmptyState } from '@housing-platform/ui';

import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

export function NotificationList() {
  const { data: notifications, isLoading, error } = useNotifications();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading notifications...</p>;
  }

  if (error) {
    return (
      <p className="text-ink-muted text-sm">Unable to load notifications. Please try again.</p>
    );
  }

  if (!notifications?.length) {
    return <EmptyState className="mt-6" description="You have no notifications yet." />;
  }

  return (
    <div className="mt-6 space-y-3">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
