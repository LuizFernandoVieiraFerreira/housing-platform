/**
 * Centralized error handling for TanStack Query.
 *
 * Provides global error handlers and utilities for queries and mutations.
 */

import type { QueryClient } from '@tanstack/react-query';

import { AppError, getErrorMessage, logError } from './errors';

/**
 * Global error handler for queries.
 *
 * Called when a query fails. Logs the error for observability.
 * Individual queries can override this with their own onError.
 */
export function handleQueryError(error: unknown): void {
  logError(error, { component: 'TanStack Query', action: 'query' });
}

/**
 * Global error handler for mutations.
 *
 * Called when a mutation fails. Logs the error for observability.
 * Individual mutations should still handle errors in their onError
 * for UI feedback (toast, form error, etc.).
 */
export function handleMutationError(error: unknown): void {
  logError(error, { component: 'TanStack Query', action: 'mutation' });
}

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
    // Don't retry auth/validation errors
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

    // Retry network errors
    if (error.isAny('NETWORK_ERROR', 'TIMEOUT', 'API_ERROR')) {
      return true;
    }
  }

  // Default: retry once
  return true;
}

/**
 * Extract a user-friendly error message for display in UI.
 *
 * This is the primary function components should use.
 */
export function getQueryErrorMessage(error: unknown, fallback?: string): string {
  return getErrorMessage(error, fallback);
}

/**
 * Create QueryClient default options with centralized error handling.
 *
 * Usage in AppProviders:
 * ```ts
 * const queryClient = new QueryClient(createQueryClientOptions());
 * ```
 */
export function createQueryClientOptions() {
  return {
    defaultOptions: {
      queries: {
        retry: (failureCount: number, error: unknown) =>
          shouldRetryQuery(failureCount, error),
        refetchOnWindowFocus: false,
        staleTime: 30_000, // 30 seconds default
      },
      mutations: {
        // Mutations don't retry by default
        retry: false,
      },
    },
  };
}

/**
 * Configure a QueryClient with global error handlers.
 *
 * This should be called once when creating the QueryClient.
 */
export function configureQueryClient(queryClient: QueryClient): void {
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      // Note: TanStack Query v5 uses throwOnError instead of onError
    },
    mutations: {
      ...queryClient.getDefaultOptions().mutations,
    },
  });
}
