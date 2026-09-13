/**
 * Booking feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { BookingStatus, BookingType } from './types';

// ============================================================================
// Status Groups
// ============================================================================

/**
 * Booking statuses that allow cancellation by the customer.
 */
export const CANCELLABLE_STATUSES: readonly BookingStatus[] = [
  'requested',
  'pending_payment',
] as const;

/**
 * Booking statuses that allow payment.
 */
export const PAYABLE_STATUSES: readonly BookingStatus[] = [
  'pending_payment',
  'payment_failed',
] as const;

/**
 * Booking statuses considered "active" (in progress).
 */
export const ACTIVE_STATUSES: readonly BookingStatus[] = [
  'requested',
  'pending_payment',
  'confirmed',
  'active',
] as const;

/**
 * Booking statuses considered "terminal" (final state).
 */
export const TERMINAL_STATUSES: readonly BookingStatus[] = [
  'expired',
  'completed',
  'cancelled',
  'rejected',
] as const;

// ============================================================================
// Business Rules
// ============================================================================

/**
 * Default hold duration for instant bookings (in minutes).
 */
export const DEFAULT_HOLD_DURATION_MINUTES = 15;

/**
 * Maximum guest count allowed per booking.
 */
export const MAX_GUEST_COUNT = 20;

/**
 * Minimum advance booking (in days).
 */
export const MIN_ADVANCE_BOOKING_DAYS = 0;

/**
 * Maximum advance booking (in days).
 */
export const MAX_ADVANCE_BOOKING_DAYS = 365;

// ============================================================================
// Booking Types
// ============================================================================

/**
 * All possible booking types with display info.
 */
export const BOOKING_TYPES: Record<BookingType, { key: BookingType; requiresApproval: boolean }> = {
  instant: { key: 'instant', requiresApproval: false },
  request: { key: 'request', requiresApproval: true },
} as const;

// ============================================================================
// Status Metadata
// ============================================================================

/**
 * Status configuration for UI rendering.
 */
export const STATUS_CONFIG: Record<
  BookingStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    canCancel: boolean;
    canPay: boolean;
  }
> = {
  requested: { variant: 'info', canCancel: true, canPay: false },
  pending_payment: { variant: 'warning', canCancel: true, canPay: true },
  expired: { variant: 'error', canCancel: false, canPay: false },
  confirmed: { variant: 'success', canCancel: false, canPay: false },
  payment_failed: { variant: 'error', canCancel: false, canPay: true },
  active: { variant: 'success', canCancel: false, canPay: false },
  completed: { variant: 'default', canCancel: false, canPay: false },
  cancelled: { variant: 'default', canCancel: false, canPay: false },
  rejected: { variant: 'error', canCancel: false, canPay: false },
} as const;
