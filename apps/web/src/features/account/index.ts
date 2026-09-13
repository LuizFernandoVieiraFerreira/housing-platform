/**
 * Account feature public API
 *
 * Usage:
 *   import { useCurrentProfile, accountKeys } from '@/features/account';
 *   import { Profile, isProfileComplete } from '@/features/account';
 */

// Query keys (colocated with feature)
export { accountKeys } from './keys';

// Hooks
export { useCurrentProfile, useUpdateProfileMutation } from './hooks/useProfile';

// Layouts
export { AccountLayout } from './layouts/AccountLayout';

// Model layer (types, schemas, constants, utils)
export type { Profile, ProfileUpdateInput, UserRole } from './model';
export {
  // Schemas
  profileUpdateSchema,
  // Constants
  DEFAULT_LANGUAGE,
  MAX_FULL_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  ROLE_CONFIG,
  SUPPORTED_LANGUAGES,
  USER_ROLES,
  // Utils
  canHostProperties,
  canManageUsers,
  getDisplayName,
  getValidLanguage,
  isAdmin,
  isHost,
  isProfileComplete,
  isProfileDeleted,
  isSupportedLanguage,
} from './model';
export type { SupportedLanguage } from './model';
