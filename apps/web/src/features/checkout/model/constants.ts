/**
 * Checkout feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { PaymentStatus } from './types';

// ============================================================================
// Payment Status Values
// ============================================================================

/**
 * All possible payment status values.
 */
export const PAYMENT_STATUSES = ['pending', 'confirmed', 'failed', 'cancelled'] as const;

// ============================================================================
// Status Groups
// ============================================================================

/**
 * Payment statuses that indicate success.
 */
export const PAYMENT_SUCCESS_STATUSES: readonly PaymentStatus[] = ['confirmed'] as const;

/**
 * Payment statuses that indicate failure.
 */
export const PAYMENT_FAILURE_STATUSES: readonly PaymentStatus[] = ['failed', 'cancelled'] as const;

/**
 * Payment statuses that are still in progress (awaiting action).
 */
export const PAYMENT_PENDING_STATUSES: readonly PaymentStatus[] = ['pending'] as const;

/**
 * Payment statuses that are terminal (final state).
 */
export const PAYMENT_TERMINAL_STATUSES: readonly PaymentStatus[] = [
  'confirmed',
  'failed',
  'cancelled',
] as const;

// ============================================================================
// Status Metadata
// ============================================================================

/**
 * Status configuration for UI rendering.
 */
export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    isTerminal: boolean;
    canRetry: boolean;
  }
> = {
  pending: { variant: 'warning', isTerminal: false, canRetry: false },
  confirmed: { variant: 'success', isTerminal: true, canRetry: false },
  failed: { variant: 'error', isTerminal: true, canRetry: true },
  cancelled: { variant: 'default', isTerminal: true, canRetry: false },
} as const;

// ============================================================================
// Toss Payments Configuration
// ============================================================================

/**
 * Default Toss success URL path (relative to app origin).
 */
export const TOSS_SUCCESS_PATH = '/payment/success';

/**
 * Default Toss fail URL path (relative to app origin).
 */
export const TOSS_FAIL_PATH = '/payment/fail';

/**
 * Dev mock payment key prefix.
 */
export const DEV_MOCK_PAYMENT_KEY_PREFIX = 'devmock_';

// ============================================================================
// Business Rules
// ============================================================================

/**
 * Minimum payment amount in KRW.
 */
export const MIN_PAYMENT_AMOUNT_KRW = 100;

/**
 * Maximum payment amount in KRW (Toss limit).
 */
export const MAX_PAYMENT_AMOUNT_KRW = 10_000_000_000;
