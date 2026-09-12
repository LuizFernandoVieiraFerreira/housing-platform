/**
 * Query keys for the account feature.
 * Colocated with hooks for better maintainability.
 */
export const accountKeys = {
  all: ['account'] as const,
  profile: {
    all: ['account', 'profile'] as const,
    current: (userId: string) => ['account', 'profile', 'current', userId] as const,
  },
} as const;
