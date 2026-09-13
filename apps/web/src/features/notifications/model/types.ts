/**
 * Notifications feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for notification types within the feature.
 */

// Re-export shared types from the types package
export type { Notification, NotificationType } from '@housing-platform/types';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * Row type returned by Supabase for notification queries.
 * Used internally by mappers.
 */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: import('@housing-platform/types').NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}
