/**
 * Query keys for the booking feature.
 * Colocated with hooks for better maintainability.
 */
export const bookingKeys = {
  all: ['bookings'] as const,
  mine: () => ['bookings', 'mine'] as const,
  detail: (bookingId: string) => ['bookings', 'detail', bookingId] as const,
  quote: (input: Record<string, unknown> | null) => ['bookings', 'quote', input] as const,
} as const;
