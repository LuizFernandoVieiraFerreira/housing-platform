/**
 * Account model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
 * - Schemas (Zod validation)
 * - Constants (business rules, configuration)
 * - Utils (pure functions, no React/i18n dependencies)
 *
 * Rules:
 * - No React imports
 * - No i18n dependencies
 * - No external API calls
 * - Fully testable without mocking
 */

// Types
export type { Profile, ProfileUpdateInput, UserRole } from './types';

// Schemas
export { profileUpdateSchema } from './schemas';

// Constants
export {
  DEFAULT_LANGUAGE,
  MAX_FULL_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  ROLE_CONFIG,
  SUPPORTED_LANGUAGES,
  USER_ROLES,
  type SupportedLanguage,
} from './constants';

// Utils
export {
  canHostProperties,
  canManageUsers,
  getDisplayName,
  getValidLanguage,
  isAdmin,
  isHost,
  isProfileComplete,
  isProfileDeleted,
  isSupportedLanguage,
} from './utils';
