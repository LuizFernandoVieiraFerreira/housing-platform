/**
 * Auth model layer - pure domain definitions.
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
export type {
  AuthErrorContext,
  ForgotPasswordInput,
  LoginInput,
  PostLoginOptions,
  Profile,
  ProfileFormInput,
  ProfileUpdateInput,
  ResetPasswordInput,
  RolePathConfig,
  SignUpInput,
  UserRole,
} from './types';

// Schemas
export {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signUpSchema,
} from './schemas';

// Constants
export {
  ACCOUNT_PATH,
  AUTH_ERROR_CODES,
  type AuthErrorCode,
  AUTH_RETRY_DELAY_MS,
  DEFAULT_POST_LOGIN_PATH,
  DEFAULT_UNAUTHENTICATED_PATH,
  EMAIL_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_EXPIRY_MS,
  MAX_AUTH_RETRY_ATTEMPTS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  RETRIABLE_ERROR_CODES,
  ROLE_HOME_PATHS,
  SESSION_TIMEOUT_MS,
  TOKEN_REFRESH_THRESHOLD_MS,
} from './constants';

// Utils
export {
  canAccessHostFeatures,
  getAuthenticatedHomePath,
  getSafeReturnTo,
  isAdminRole,
  isHostRole,
  isRetriableError,
  isValidEmailFormat,
  isValidInternalPath,
  mapSupabaseErrorCode,
  resolvePostLoginPath,
} from './utils';
