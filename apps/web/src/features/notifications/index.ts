/**
 * Notifications feature public API
 *
 * Usage:
 *   import { useNotifications, NotificationProvider, notificationKeys } from '@/features/notifications';
 */

// Query keys (colocated with feature)
export { notificationKeys } from './keys';

// Hooks
export { useNotifications, useUnreadNotificationCount } from './hooks/useNotifications';
export { useNotificationMutations } from './hooks/useNotificationMutations';

// Components
export { NotificationProvider } from './components/NotificationProvider';
