/**
 * Auth feature validation schemas.
 *
 * Re-exports shared schemas from the validation package.
 * Add feature-specific schemas here if needed.
 */

// Re-export shared schemas
export {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signUpSchema,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Schemas (if needed)
// ============================================================================

// Example: Add feature-specific schemas here
// export const authFilterSchema = z.object({ ... });
