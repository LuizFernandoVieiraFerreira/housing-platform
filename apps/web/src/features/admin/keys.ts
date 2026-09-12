/**
 * Query keys for the admin feature.
 * Colocated with hooks for better maintainability.
 */
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => ['admin', 'dashboard'] as const,
  properties: () => ['admin', 'properties'] as const,
  hosts: () => ['admin', 'hosts'] as const,
  bookings: () => ['admin', 'bookings'] as const,
  payments: () => ['admin', 'payments'] as const,
  housingRequests: () => ['admin', 'housing-requests'] as const,
  auditLogs: () => ['admin', 'audit-logs'] as const,
} as const;
