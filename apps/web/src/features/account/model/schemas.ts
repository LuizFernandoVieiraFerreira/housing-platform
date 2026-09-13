/**
 * Account feature validation schemas.
 *
 * Re-exports shared schemas from the validation package.
 * Add feature-specific schemas here if needed.
 */

// Re-export shared schemas
export { profileUpdateSchema } from '@housing-platform/validation';

// Inferred types are also available from validation package
export type { ProfileUpdateInput } from '@housing-platform/validation';

// ============================================================================
// Feature-Local Schemas (if needed)
// ============================================================================

// Example: Add feature-specific schemas here
// export const profileFilterSchema = z.object({ ... });
