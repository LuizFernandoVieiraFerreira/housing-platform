/**
 * Query keys for the host feature.
 * Colocated with hooks for better maintainability.
 */
export const hostKeys = {
  all: ['host'] as const,
  current: () => ['host', 'current'] as const,
  properties: {
    all: () => ['host', 'properties'] as const,
    detail: (propertyId: string) => ['host', 'properties', propertyId] as const,
  },
  bookings: () => ['host', 'bookings'] as const,
  amenities: () => ['host', 'amenities'] as const,
} as const;
