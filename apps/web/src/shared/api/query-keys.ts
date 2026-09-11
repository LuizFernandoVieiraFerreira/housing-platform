export const queryKeys = {
  profile: {
    current: (userId = 'anonymous') => ['profile', 'current', userId] as const,
  },
  properties: {
    featured: ['properties', 'featured'] as const,
    search: (filters: Record<string, unknown>) => ['properties', 'search', filters] as const,
    aiSearch: (request: Record<string, unknown> | null) => ['properties', 'ai-search', request] as const,
    detail: (propertyId: string) => ['properties', 'detail', propertyId] as const,
  },
  bookings: {
    mine: ['bookings', 'mine'] as const,
    detail: (bookingId: string) => ['bookings', 'detail', bookingId] as const,
    quote: (input: Record<string, unknown> | null) => ['bookings', 'quote', input] as const,
  },
  host: {
    current: ['host', 'current'] as const,
    properties: ['host', 'properties'] as const,
    property: (propertyId: string) => ['host', 'properties', propertyId] as const,
    bookings: ['host', 'bookings'] as const,
    amenities: ['host', 'amenities'] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    properties: ['admin', 'properties'] as const,
    hosts: ['admin', 'hosts'] as const,
    bookings: ['admin', 'bookings'] as const,
    payments: ['admin', 'payments'] as const,
    housingRequests: ['admin', 'housing-requests'] as const,
    auditLogs: ['admin', 'audit-logs'] as const,
  },
  notifications: {
    list: (userId: string) => ['notifications', 'list', userId] as const,
    unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
  },
} as const;
