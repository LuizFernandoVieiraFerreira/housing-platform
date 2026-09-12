/**
 * Query keys for the listings feature.
 * Colocated with hooks for better maintainability.
 */
export const listingsKeys = {
  all: ['listings'] as const,
  featured: () => ['listings', 'featured'] as const,
} as const;
