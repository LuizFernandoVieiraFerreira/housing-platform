/**
 * Account feature utility functions.
 *
 * Pure functions with no React or i18n dependencies.
 * Fully testable without mocking.
 */

import type { Profile, UserRole } from './types';
import { ROLE_CONFIG, SUPPORTED_LANGUAGES, type SupportedLanguage } from './constants';

// ============================================================================
// Role Utilities
// ============================================================================

/**
 * Check if a user role can host properties.
 */
export function canHostProperties(role: UserRole): boolean {
  return ROLE_CONFIG[role].canHostProperties;
}

/**
 * Check if a user role can manage users.
 */
export function canManageUsers(role: UserRole): boolean {
  return ROLE_CONFIG[role].canManageUsers;
}

/**
 * Check if a role is admin.
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if a role is host.
 */
export function isHost(role: UserRole): boolean {
  return role === 'host';
}

// ============================================================================
// Profile Utilities
// ============================================================================

/**
 * Check if a profile is complete (has all required fields).
 */
export function isProfileComplete(profile: Profile): boolean {
  return Boolean(profile.full_name.trim());
}

/**
 * Check if a profile has been soft-deleted.
 */
export function isProfileDeleted(profile: Profile): boolean {
  return profile.deleted_at !== null;
}

/**
 * Get the display name for a profile (falls back to 'User' if empty).
 */
export function getDisplayName(profile: Profile | null | undefined): string {
  if (!profile) {
    return 'User';
  }

  return profile.full_name.trim() || 'User';
}

// ============================================================================
// Language Utilities
// ============================================================================

/**
 * Check if a language code is supported.
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Get a valid language code, falling back to default if unsupported.
 */
export function getValidLanguage(lang: string | null | undefined): SupportedLanguage {
  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return 'en';
}
