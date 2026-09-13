/**
 * Pure utility functions for checkout/payment domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { PaymentStatus } from './types';
import {
  DEV_MOCK_PAYMENT_KEY_PREFIX,
  PAYMENT_FAILURE_STATUSES,
  PAYMENT_PENDING_STATUSES,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_TERMINAL_STATUSES,
} from './constants';

// ============================================================================
// Status Checks
// ============================================================================

/**
 * Check if a payment is in a successful state.
 */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return PAYMENT_SUCCESS_STATUSES.includes(status);
}

/**
 * Check if a payment has failed.
 */
export function isPaymentFailed(status: PaymentStatus): boolean {
  return PAYMENT_FAILURE_STATUSES.includes(status);
}

/**
 * Check if a payment is still pending.
 */
export function isPaymentPending(status: PaymentStatus): boolean {
  return PAYMENT_PENDING_STATUSES.includes(status);
}

/**
 * Check if a payment is in a terminal (final) state.
 */
export function isPaymentTerminal(status: PaymentStatus): boolean {
  return PAYMENT_TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a payment can be retried.
 */
export function canRetryPayment(status: PaymentStatus): boolean {
  return PAYMENT_STATUS_CONFIG[status].canRetry;
}

/**
 * Get status configuration for UI rendering.
 */
export function getPaymentStatusConfig(status: PaymentStatus) {
  return PAYMENT_STATUS_CONFIG[status];
}

// ============================================================================
// Payment Key Utilities
// ============================================================================

/**
 * Create a dev mock payment key for testing.
 */
export function createDevMockPaymentKey(orderId: string): string {
  return `${DEV_MOCK_PAYMENT_KEY_PREFIX}${orderId}`;
}

/**
 * Check if a payment key is a dev mock key.
 */
export function isDevMockPaymentKey(paymentKey: string): boolean {
  return paymentKey.startsWith(DEV_MOCK_PAYMENT_KEY_PREFIX);
}

// ============================================================================
// Amount Utilities
// ============================================================================

/**
 * Format amount in KRW for display.
 */
export function formatAmountKrw(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * Validate that amount is within Toss payment limits.
 */
export function isValidPaymentAmount(amount: number): boolean {
  return amount >= 100 && amount <= 10_000_000_000;
}
