/**
 * Host feature validation schemas.
 *
 * Re-exports shared schemas from the validation package.
 * Add feature-specific schemas here if needed.
 */

// Re-export shared schemas
export {
  hostRegisterSchema,
  hostPropertySchema,
  hostRoomSchema,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Schemas (if needed)
// ============================================================================

// Example: Add feature-specific schemas here
// export const hostFilterSchema = z.object({ ... });
