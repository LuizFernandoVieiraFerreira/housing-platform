/**
 * Checkout model layer - pure domain definitions.
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
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  CreatePaymentInput,
  CreatePaymentOrderResult,
  Payment,
  PaymentRow,
  PaymentStatus,
} from './types';

// Schemas
export { confirmPaymentSchema, createPaymentSchema } from './schemas';

// Constants
export {
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
} from './constants';

// Utils
export {
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
} from './utils';
