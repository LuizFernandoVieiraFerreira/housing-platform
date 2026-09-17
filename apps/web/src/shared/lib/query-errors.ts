/**
 * TanStack Query client defaults (retry policy, stale time).
 */

import { AppError } from './result';

/**
 * Check if an error should trigger a retry.
 *
 * Network errors and rate limits should retry.
 * Auth errors and validation errors should not.
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
  maxRetries = 1,
): boolean {
  if (failureCount >= maxRetries) {
    return false;
  }

  if (error instanceof AppError) {
    if (
      error.isAny(
        'AUTH_REQUIRED',
        'FORBIDDEN',
        'INVALID_CREDENTIALS',
        'VALIDATION_ERROR',
        'NOT_FOUND',
      )
    ) {
      return false;
    }

    if (error.isAny('NETWORK_ERROR', 'TIMEOUT', 'API_ERROR')) {
      return true;
    }
  }

  return true;
}

/**
 * QueryClient default options.
 *
 * @example
 * const queryClient = new QueryClient(createQueryClientOptions());
 */
export function createQueryClientOptions() {
  return {
    defaultOptions: {
      queries: {
        retry: (failureCount: number, error: unknown) =>
          shouldRetryQuery(failureCount, error),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  };
}
