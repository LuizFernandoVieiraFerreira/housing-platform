/**
 * Checkout feature public API
 *
 * Usage:
 *   import { useCreatePaymentOrder, checkoutKeys } from '@/features/checkout';
 */

// Query keys (colocated with feature)
export { checkoutKeys } from './keys';

// Hooks
export { useCreatePaymentOrder, useConfirmPayment } from './hooks/usePayment';

// API (Result-returning for explicit error handling)
export {
  confirmPayment,
  createPaymentOrder,
  // Toss configuration (environment-dependent)
  getTossClientKey,
  getTossFailUrl,
  getTossSuccessUrl,
  isPaymentDevMockEnabled,
} from './api/payment-api';

// Model layer (pure domain definitions)
export {
  // Types
  type ConfirmPaymentInput,
  type ConfirmPaymentResult,
  type CreatePaymentInput,
  type CreatePaymentOrderResult,
  type Payment,
  type PaymentRow,
  type PaymentStatus,
  // Schemas
  confirmPaymentSchema,
  createPaymentSchema,
  // Constants
  DEV_MOCK_PAYMENT_KEY_PREFIX,
  MAX_PAYMENT_AMOUNT_KRW,
  MIN_PAYMENT_AMOUNT_KRW,
  PAYMENT_FAILURE_STATUSES,
  PAYMENT_PENDING_STATUSES,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_STATUSES,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_TERMINAL_STATUSES,
  TOSS_FAIL_PATH,
  TOSS_SUCCESS_PATH,
  // Utils
  canRetryPayment,
  createDevMockPaymentKey,
  formatAmountKrw,
  getPaymentStatusConfig,
  isDevMockPaymentKey,
  isPaymentFailed,
  isPaymentPending,
  isPaymentSuccessful,
  isPaymentTerminal,
  isValidPaymentAmount,
} from './model';
