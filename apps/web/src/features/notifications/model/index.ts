/**
 * Notifications model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
 * - Constants (business rules, configuration)
 * - Utils (pure functions, no React/i18n dependencies)
 *
 * Rules:
 * - No React imports
 * - No i18n dependencies
 * - No external API calls
 * - Fully testable without mocking
 */

// Types
export type { Notification, NotificationRow, NotificationType } from './types';

// Constants
export {
  BOOKING_NOTIFICATION_TYPES,
  MAX_NOTIFICATIONS_FETCH,
  NOTIFICATION_TYPES,
} from './constants';

// Utils
export {
  filterNotificationsByType,
  filterUnreadNotifications,
  isBookingNotification,
  isBookingNotificationType,
  isReadNotification,
  isUnreadNotification,
} from './utils';
