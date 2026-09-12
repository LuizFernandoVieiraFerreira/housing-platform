/**
 * Unified error handling utilities.
 *
 * This module provides consistent error handling patterns for the application.
 * Import from here instead of directly from result.ts for cleaner imports.
 *
 * @example
 * // In API files
 * import { AppError, wrapSupabaseError } from '@/shared/lib/errors';
 *
 * // In components
 * import { getErrorMessage } from '@/shared/lib/errors';
 */

// Re-export core types from result.ts
export {
  AppError,
  Result,
  type ErrorCode,
  // Type guards
  isOk,
  isErr,
  // Unwrap utilities
  unwrap,
  unwrapOr,
  getError,
  // Mapping utilities
  mapResult,
  mapError,
  flatMap,
  // Async utilities
  tryCatch,
  tryCatchSync,
  // Message extraction
  getUserErrorMessage,
} from './result';

// ============================================================================
// Supabase Error Helpers
// ============================================================================

import { AppError, type ErrorCode } from './result';
import { logger } from './logger';

// Re-export logger for consumers
export { logger };

/**
 * Wrap a Supabase error into an AppError.
 *
 * @example
 * const { data, error } = await supabase.from('profiles').select();
 * if (error) {
 *   throw wrapSupabaseError(error, 'Unable to load profile');
 * }
 */
export function wrapSupabaseError(
  error: { message: string; code?: string; details?: string } | null,
  fallbackMessage = 'Database operation failed',
): AppError {
  return AppError.fromSupabase(error, fallbackMessage);
}

/**
 * Standard error codes for common Supabase operations.
 */
export const SupabaseErrorCodes = {
  FETCH: 'API_ERROR',
  CREATE: 'API_ERROR',
  UPDATE: 'API_ERROR',
  DELETE: 'API_ERROR',
  AUTH: 'AUTH_REQUIRED',
  PERMISSION: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'VALIDATION_ERROR',
} as const satisfies Record<string, ErrorCode>;

// ============================================================================
// Component Error Helpers
// ============================================================================

import { getUserErrorMessage } from './result';

/**
 * Extract a user-friendly error message from any error.
 *
 * This is the primary function components should use for displaying errors.
 *
 * @example
 * try {
 *   await mutation.mutateAsync(data);
 * } catch (error) {
 *   setError(getErrorMessage(error, 'Unable to save changes'));
 * }
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  // Handle null/undefined
  if (error == null) {
    return fallback;
  }

  // Handle AppError
  if (error instanceof AppError) {
    return getUserErrorMessage(error, fallback);
  }

  // Handle standard Error
  if (error instanceof Error) {
    // Check if the message looks technical
    if (isTechnicalMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }

  // Handle objects with message property (Supabase errors, etc.)
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    if (isTechnicalMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (isTechnicalMessage(error)) {
      return fallback;
    }
    return error;
  }

  return fallback;
}

/**
 * Check if an error message looks technical/internal.
 */
function isTechnicalMessage(message: string): boolean {
  return (
    message.includes('PGRST') ||
    message.includes('TypeError') ||
    message.includes('SyntaxError') ||
    message.includes('ReferenceError') ||
    message.includes(' at ') || // Stack traces
    message.startsWith('Error:') ||
    /^[A-Z_]+$/.test(message) || // All caps error codes
    message.includes('Cannot read properties') ||
    message.includes('undefined is not')
  );
}

// ============================================================================
// Mutation Error Handler
// ============================================================================

/**
 * Standard error handler for TanStack Query mutations.
 *
 * @example
 * const mutation = useMutation({
 *   mutationFn: updateProfile,
 *   onError: (error) => {
 *     setError(handleMutationError(error, 'Unable to update profile'));
 *   },
 * });
 */
export function handleMutationError(error: unknown, fallback: string): string {
  return getErrorMessage(error, fallback);
}

// ============================================================================
// Error Boundary Helpers
// ============================================================================

/**
 * Log an error for observability (Sentry + console in dev).
 *
 * @example
 * catch (error) {
 *   logError(error, { component: 'CheckoutPage', action: 'processPayment' });
 *   setError(getErrorMessage(error));
 * }
 */
export function logError(
  error: unknown,
  context: { component?: string; action?: string; data?: Record<string, unknown> } = {},
): void {
  logger.error('Error occurred', {
    ...context,
    error,
  });
}
