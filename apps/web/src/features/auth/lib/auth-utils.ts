import { AppError, getUserErrorMessage } from '@/shared/lib/result';

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

export function getSafeReturnTo(value: string | null, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

/** Home path for an already-authenticated user based on their profile role. */
export function getAuthenticatedHomePath(role: string | undefined, fallback = '/'): string {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'host') {
    return '/host';
  }

  return fallback;
}

/** Where to send the user after a successful login. Honors an explicit returnTo when present. */
export function resolvePostLoginPath(options: {
  returnToParam: string | null;
  defaultRedirectTo: string;
  role: string | undefined;
}): string {
  const { returnToParam, defaultRedirectTo, role } = options;

  if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//')) {
    return getSafeReturnTo(returnToParam, defaultRedirectTo);
  }

  return getAuthenticatedHomePath(role, defaultRedirectTo);
}
