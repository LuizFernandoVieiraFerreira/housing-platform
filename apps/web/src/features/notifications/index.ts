/**
 * Notifications feature public API
 *
 * Usage:
 *   import { useNotifications, NotificationProvider } from '@/features/notifications';
 */

// Hooks
export { useNotifications, useUnreadNotificationCount } from './hooks/useNotifications';
export { useNotificationMutations } from './hooks/useNotificationMutations';

// Components
export { NotificationProvider } from './components/NotificationProvider';
