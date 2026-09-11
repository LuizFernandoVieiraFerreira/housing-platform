import type { Notification } from '@housing-platform/types';
import { Link } from 'react-router-dom';

import { useNotificationMutations } from '@/features/notifications/hooks/useNotificationMutations';

function formatNotificationDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationLink(notification: Notification): string | null {
  const bookingId = notification.metadata.booking_id;

  if (typeof bookingId === 'string' && bookingId.length > 0) {
    return `/bookings/${bookingId}`;
  }

  return null;
}

type NotificationItemProps = {
  notification: Notification;
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markRead } = useNotificationMutations();
  const link = getNotificationLink(notification);
  const isUnread = notification.readAt === null;

  function handleClick() {
    if (isUnread && !markRead.isPending) {
      markRead.mutate(notification.id);
    }
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-semibold ${isUnread ? 'text-ink' : 'text-ink-muted'}`}>
          {notification.title}
        </p>
        {isUnread ? <span className="bg-brand-600 mt-1.5 size-2 shrink-0 rounded-full" /> : null}
      </div>
      <p className="text-ink-muted mt-1 text-sm">{notification.body}</p>
      <p className="text-ink-muted mt-2 text-xs">
        {formatNotificationDate(notification.createdAt)}
      </p>
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        onClick={handleClick}
        className="border-surface-subtle hover:bg-surface-muted/30 block rounded-xl border p-4 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-surface-subtle hover:bg-surface-muted/30 block w-full rounded-xl border p-4 text-left transition-colors"
    >
      {content}
    </button>
  );
}
