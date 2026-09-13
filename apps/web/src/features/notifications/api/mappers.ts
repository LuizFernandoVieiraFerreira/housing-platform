/**
 * Data transformation functions for notification API responses.
 *
 * Mappers convert between:
 * - API/Supabase row format (snake_case)
 * - Domain model format (camelCase)
 *
 * This centralizes all data transformation logic for easier testing
 * and maintenance.
 */

import type { Notification, NotificationRow } from '../model';

// ============================================================================
// Response → Domain Mappers
// ============================================================================

/**
 * Map notification row to domain model.
 */
export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
