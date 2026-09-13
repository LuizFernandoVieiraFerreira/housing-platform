/**
 * Account feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { UserRole } from './types';

// ============================================================================
// User Roles
// ============================================================================

/**
 * All available user roles.
 */
export const USER_ROLES: readonly UserRole[] = ['customer', 'host', 'admin'] as const;

/**
 * Role configuration for UI rendering and permissions.
 */
export const ROLE_CONFIG: Record<
  UserRole,
  {
    canHostProperties: boolean;
    canManageUsers: boolean;
  }
> = {
  customer: { canHostProperties: false, canManageUsers: false },
  host: { canHostProperties: true, canManageUsers: false },
  admin: { canHostProperties: true, canManageUsers: true },
} as const;

// ============================================================================
// Supported Languages
// ============================================================================

/**
 * Supported languages for user preferences.
 */
export const SUPPORTED_LANGUAGES = ['en', 'ko', 'zh', 'ja'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Default language for new users.
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// ============================================================================
// Profile Constraints
// ============================================================================

/**
 * Maximum length for full name.
 */
export const MAX_FULL_NAME_LENGTH = 120;

/**
 * Maximum length for phone number.
 */
export const MAX_PHONE_LENGTH = 30;
