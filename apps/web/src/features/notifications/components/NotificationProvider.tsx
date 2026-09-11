import type { ReactNode } from 'react';

import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime';

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <NotificationRealtimeBridge />
      {children}
    </>
  );
}

function NotificationRealtimeBridge() {
  useNotificationRealtime();
  return null;
}
