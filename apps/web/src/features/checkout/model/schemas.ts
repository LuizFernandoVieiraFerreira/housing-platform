/**
 * Checkout feature validation schemas.
 *
 * Re-exports shared schemas from the validation package.
 * Add feature-specific schemas here if needed.
 */

// Re-export shared schemas
export {
  confirmPaymentSchema,
  createPaymentSchema,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Schemas (if needed)
// ============================================================================

// Example: Add feature-specific schemas here
// export const paymentFilterSchema = z.object({ ... });
