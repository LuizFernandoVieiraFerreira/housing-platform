/**
 * Checkout feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for payment types within the feature.
 */

// Re-export shared types from the types package
export type {
  ConfirmPaymentResult,
  CreatePaymentOrderResult,
  Payment,
  PaymentStatus,
} from '@housing-platform/types';

// Re-export input types from validation package
export type {
  ConfirmPaymentInput,
  CreatePaymentInput,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * Row type returned by Supabase for payment queries.
 * Used internally by mappers if needed.
 */
export interface PaymentRow {
  id: string;
  order_id: string;
  payment_key: string | null;
  booking_id: string;
  customer_id: string;
  amount_krw: number;
  status: string;
  toss_response: unknown;
  failed_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}
