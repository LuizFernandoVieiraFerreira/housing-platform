/**
 * Query keys for the notifications feature.
 * Colocated with hooks for better maintainability.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => ['notifications', 'list', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
} as const;
