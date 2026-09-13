/**
 * Notifications feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { NotificationType } from './types';

// ============================================================================
// Notification Types
// ============================================================================

/**
 * All possible notification types with display info.
 */
export const NOTIFICATION_TYPES: Record<NotificationType, { key: NotificationType }> = {
  booking_request: { key: 'booking_request' },
  booking_confirmed: { key: 'booking_confirmed' },
  booking_rejected: { key: 'booking_rejected' },
} as const;

/**
 * Notification types related to bookings.
 */
export const BOOKING_NOTIFICATION_TYPES: readonly NotificationType[] = [
  'booking_request',
  'booking_confirmed',
  'booking_rejected',
] as const;

// ============================================================================
// Business Rules
// ============================================================================

/**
 * Maximum number of notifications to fetch at once.
 */
export const MAX_NOTIFICATIONS_FETCH = 50;
