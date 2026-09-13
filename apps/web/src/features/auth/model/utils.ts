/**
 * Pure utility functions for auth domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { PostLoginOptions } from './types';
import {
  ACCOUNT_PATH,
  AUTH_ERROR_CODES,
  type AuthErrorCode,
  RETRIABLE_ERROR_CODES,
} from './constants';

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Validate and sanitize a returnTo URL path.
 * Prevents open redirect vulnerabilities.
 *
 * @param value - The returnTo value to validate
 * @param fallback - Fallback path if validation fails
 * @returns Safe path string
 */
export function getSafeReturnTo(value: string | null, fallback = ACCOUNT_PATH): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

/**
 * Get home path for an authenticated user based on their role.
 * Only admin and host have specific home paths; all others use fallback.
 *
 * @param role - User's role
 * @param fallback - Fallback path if role is not admin/host
 * @returns Home path for the role
 */
export function getAuthenticatedHomePath(role: string | undefined, fallback = '/'): string {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'host') {
    return '/host';
  }

  return fallback;
}

/**
 * Resolve the path to redirect to after successful login.
 * Honors an explicit returnTo param when present and valid.
 *
 * @param options - Post-login options
 * @returns Resolved redirect path
 */
export function resolvePostLoginPath(options: PostLoginOptions): string {
  const { returnToParam, defaultRedirectTo, role } = options;

  if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//')) {
    return getSafeReturnTo(returnToParam, defaultRedirectTo);
  }

  return getAuthenticatedHomePath(role, defaultRedirectTo);
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if an error code is retriable.
 *
 * @param code - Error code to check
 * @returns True if the error is retriable
 */
export function isRetriableError(code: AuthErrorCode): boolean {
  return RETRIABLE_ERROR_CODES.includes(code);
}

/**
 * Map a Supabase auth error to an internal error code.
 *
 * @param errorCode - Supabase error code
 * @returns Internal auth error code
 */
export function mapSupabaseErrorCode(errorCode: string | undefined): AuthErrorCode {
  if (!errorCode) {
    return AUTH_ERROR_CODES.UNKNOWN;
  }

  const mapping: Record<string, AuthErrorCode> = {
    invalid_credentials: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    email_not_confirmed: AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED,
    session_not_found: AUTH_ERROR_CODES.SESSION_EXPIRED,
    user_banned: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
    over_request_rate_limit: AUTH_ERROR_CODES.RATE_LIMITED,
  };

  return mapping[errorCode] ?? AUTH_ERROR_CODES.UNKNOWN;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if a path is a valid internal path (starts with / but not //).
 *
 * @param path - Path to validate
 * @returns True if the path is valid
 */
export function isValidInternalPath(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }

  return path.startsWith('/') && !path.startsWith('//');
}

/**
 * Check if an email is in a valid format (basic check).
 * For full validation, use the schema.
 *
 * @param email - Email to check
 * @returns True if email appears valid
 */
export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ============================================================================
// Role Utilities
// ============================================================================

/**
 * Check if a user has admin privileges.
 *
 * @param role - User's role
 * @returns True if user is admin
 */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin';
}

/**
 * Check if a user has host privileges.
 *
 * @param role - User's role
 * @returns True if user is host or admin
 */
export function isHostRole(role: string | undefined): boolean {
  return role === 'host' || role === 'admin';
}

/**
 * Check if a user can access host features.
 *
 * @param role - User's role
 * @returns True if user can access host features
 */
export function canAccessHostFeatures(role: string | undefined): boolean {
  return isHostRole(role);
}
