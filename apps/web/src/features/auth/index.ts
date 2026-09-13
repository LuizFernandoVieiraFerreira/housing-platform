/**
 * Auth feature public API
 *
 * Usage:
 *   import { useAuth, AuthProvider } from '@/features/auth';
 */

// ============================================================================
// Model Layer (pure domain logic)
// ============================================================================

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
} from './model';

// Schemas
export {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signUpSchema,
} from './model';

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
} from './model';

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
} from './model';

// ============================================================================
// React Layer (hooks, context, components)
// ============================================================================

// Hooks
export { useAuth, type AuthContextValue } from './hooks/useAuth';

// Context
export { AuthProvider } from './context/AuthProvider';

// Route guards (for use in routing)
export { GuestRoute } from './components/GuestRoute';
export { MarketplaceRoute } from './components/MarketplaceRoute';
export { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
export { AuthLayout } from './layouts/AuthLayout';

// Lib (utilities with external dependencies)
export { getAuthErrorMessage } from './lib/auth-utils';
