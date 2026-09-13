/**
 * Notifications feature public API
 *
 * Usage:
 *   import { useNotifications, NotificationProvider, notificationKeys } from '@/features/notifications';
 */

// Model layer (types, constants, utils)
export type { Notification, NotificationRow, NotificationType } from './model';
export {
  BOOKING_NOTIFICATION_TYPES,
  MAX_NOTIFICATIONS_FETCH,
  NOTIFICATION_TYPES,
  filterNotificationsByType,
  filterUnreadNotifications,
  isBookingNotification,
  isBookingNotificationType,
  isReadNotification,
  isUnreadNotification,
} from './model';

// Query keys (colocated with feature)
export { notificationKeys } from './keys';

// Hooks
export { useNotifications, useUnreadNotificationCount } from './hooks/useNotifications';
export { useNotificationMutations } from './hooks/useNotificationMutations';

// Components
export { NotificationProvider } from './components/NotificationProvider';
