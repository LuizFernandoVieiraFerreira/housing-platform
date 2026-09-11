import { Button, Card, PageHeader } from '@housing-platform/ui';

import { NotificationList } from '@/features/notifications/components/NotificationList';
import { useNotificationMutations } from '@/features/notifications/hooks/useNotificationMutations';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useNotifications';

export function NotificationsPage() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { markAllRead } = useNotificationMutations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Notifications"
            description="Stay up to date on booking requests and status changes."
          />
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          ) : null}
        </div>

        <NotificationList />
      </Card>
    </div>
  );
}
