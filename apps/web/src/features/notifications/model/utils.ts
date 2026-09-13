/**
 * Notifications feature utilities.
 *
 * Pure functions with no React, i18n, or external dependencies.
 * Fully testable without mocking.
 */

import type { Notification, NotificationType } from './types';
import { BOOKING_NOTIFICATION_TYPES } from './constants';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a notification is related to bookings.
 */
export function isBookingNotification(notification: Notification): boolean {
  return BOOKING_NOTIFICATION_TYPES.includes(notification.type);
}

/**
 * Check if a notification type is booking-related.
 */
export function isBookingNotificationType(type: NotificationType): boolean {
  return BOOKING_NOTIFICATION_TYPES.includes(type);
}

// ============================================================================
// State Checks
// ============================================================================

/**
 * Check if a notification has been read.
 */
export function isReadNotification(notification: Notification): boolean {
  return notification.readAt !== null;
}

/**
 * Check if a notification is unread.
 */
export function isUnreadNotification(notification: Notification): boolean {
  return notification.readAt === null;
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter notifications to only unread ones.
 */
export function filterUnreadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter(isUnreadNotification);
}

/**
 * Filter notifications by type.
 */
export function filterNotificationsByType(
  notifications: Notification[],
  type: NotificationType,
): Notification[] {
  return notifications.filter((n) => n.type === type);
}
