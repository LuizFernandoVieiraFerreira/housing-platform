/**
 * Auth feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for auth types within the feature.
 */

// Re-export shared types from the types package
export type { Profile, ProfileUpdateInput, UserRole } from '@housing-platform/types';

// Re-export input types from validation package
export type {
  ForgotPasswordInput,
  LoginInput,
  ProfileUpdateInput as ProfileFormInput,
  ResetPasswordInput,
  SignUpInput,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * User role with corresponding home path.
 */
export interface RolePathConfig {
  role: string;
  homePath: string;
}

/**
 * Post-login redirect options.
 */
export interface PostLoginOptions {
  returnToParam: string | null;
  defaultRedirectTo: string;
  role: string | undefined;
}

/**
 * Auth error context for consistent error handling.
 */
export interface AuthErrorContext {
  code: string;
  message: string;
  retriable: boolean;
}
