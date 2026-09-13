/**
 * Auth feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { UserRole } from './types';

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Auth-specific error codes for consistent error handling.
 */
export const AUTH_ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Session timeout in milliseconds (24 hours).
 */
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Refresh token threshold in milliseconds (5 minutes before expiry).
 */
export const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// ============================================================================
// Role-based Paths
// ============================================================================

/**
 * Home paths for authenticated users based on role.
 */
export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  customer: '/',
  host: '/host',
  admin: '/admin',
} as const;

/**
 * Default path for unauthenticated users.
 */
export const DEFAULT_UNAUTHENTICATED_PATH = '/login';

/**
 * Default path after successful login (when no returnTo).
 */
export const DEFAULT_POST_LOGIN_PATH = '/account';

/**
 * Default path for account-related pages.
 */
export const ACCOUNT_PATH = '/account';

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Error codes that are retriable.
 */
export const RETRIABLE_ERROR_CODES: readonly AuthErrorCode[] = [
  AUTH_ERROR_CODES.NETWORK_ERROR,
  AUTH_ERROR_CODES.RATE_LIMITED,
] as const;

/**
 * Maximum retry attempts for auth operations.
 */
export const MAX_AUTH_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in milliseconds (exponential backoff base).
 */
export const AUTH_RETRY_DELAY_MS = 1000;

// ============================================================================
// Password Rules
// ============================================================================

/**
 * Minimum password length.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum password length (bcrypt limit).
 */
export const MAX_PASSWORD_LENGTH = 72;

// ============================================================================
// Email Verification
// ============================================================================

/**
 * Email verification resend cooldown in milliseconds (60 seconds).
 */
export const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Email verification link expiry in milliseconds (24 hours).
 */
export const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
