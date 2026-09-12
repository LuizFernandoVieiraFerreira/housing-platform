/**
 * Query keys for the checkout feature.
 * Colocated with hooks for better maintainability.
 */
export const checkoutKeys = {
  all: ['checkout'] as const,
  payment: (bookingId: string) => ['checkout', 'payment', bookingId] as const,
} as const;
