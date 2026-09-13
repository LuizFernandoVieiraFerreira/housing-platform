/**
 * Auth utilities with error handling integration.
 *
 * This module re-exports pure utilities from model/utils.ts and adds
 * utilities that require external dependencies (e.g., AppError).
 *
 * For pure domain logic, prefer importing directly from '@/features/auth/model'.
 */

import { AppError, getUserErrorMessage } from '@/shared/lib/result';

// Re-export pure utilities from model layer
export {
  getAuthenticatedHomePath,
  getSafeReturnTo,
  resolvePostLoginPath,
} from '@/features/auth/model';

/**
 * Extract a user-friendly error message from an auth error.
 *
 * Uses the Result pattern's AppError for consistent error handling.
 */
export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  // Handle null/undefined explicitly
  if (error == null) {
    return fallback;
  }

  // If it's already an AppError, use the standardized message extraction
  if (error instanceof AppError) {
    return getUserErrorMessage(error, fallback);
  }

  // Convert to AppError and extract message
  const appError = AppError.from(error, 'AUTH_REQUIRED');
  return getUserErrorMessage(appError, fallback);
}
