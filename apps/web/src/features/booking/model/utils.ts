/**
 * Pure utility functions for booking domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { BookingStatus } from './types';
import {
  CANCELLABLE_STATUSES,
  PAYABLE_STATUSES,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  STATUS_CONFIG,
} from './constants';

// ============================================================================
// Status Checks
// ============================================================================

/**
 * Check if a booking can be cancelled by the customer.
 */
export function canCancelBooking(status: BookingStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

/**
 * Check if a booking can be paid.
 */
export function canPayBooking(status: BookingStatus): boolean {
  return PAYABLE_STATUSES.includes(status);
}

/**
 * Check if a booking is in an active (in-progress) state.
 */
export function isActiveBooking(status: BookingStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/**
 * Check if a booking is in a terminal (final) state.
 */
export function isTerminalBooking(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Get status configuration for UI rendering.
 */
export function getStatusConfig(status: BookingStatus) {
  return STATUS_CONFIG[status];
}

// ============================================================================
// Hold Expiration
// ============================================================================

/**
 * Check if a booking hold has expired.
 */
export function isHoldExpired(holdExpiresAt: string | null): boolean {
  if (!holdExpiresAt) {
    return false;
  }

  return new Date(holdExpiresAt).getTime() <= Date.now();
}

/**
 * Calculate remaining time until hold expires (in milliseconds).
 * Returns 0 if already expired or no expiration set.
 */
export function getHoldRemainingMs(holdExpiresAt: string | null): number {
  if (!holdExpiresAt) {
    return 0;
  }

  const remaining = new Date(holdExpiresAt).getTime() - Date.now();
  return Math.max(0, remaining);
}

// ============================================================================
// Date Calculations
// ============================================================================

/**
 * Calculate default checkout date based on check-in and minimum stay.
 */
export function getDefaultCheckOut(checkIn: string, minStayNights: number): string {
  const date = new Date(`${checkIn}T00:00:00`);
  date.setDate(date.getDate() + minStayNights);
  return date.toISOString().slice(0, 10);
}

/**
 * Calculate number of nights between two dates.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const startDate = new Date(`${checkIn}T00:00:00`);
  const endDate = new Date(`${checkOut}T00:00:00`);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate that checkout is after checkin.
 */
export function isValidDateRange(checkIn: string, checkOut: string): boolean {
  return checkOut > checkIn;
}

// ============================================================================
// Price Calculations
// ============================================================================

/**
 * Calculate service fee percentage from amounts.
 */
export function calculateServiceFeePercent(rentKrw: number, serviceFeeKrw: number): number {
  if (rentKrw <= 0) {
    return 0;
  }
  return Math.round((serviceFeeKrw / rentKrw) * 100);
}

/**
 * Calculate total from rent and service fee.
 */
export function calculateTotal(rentKrw: number, serviceFeeKrw: number): number {
  return rentKrw + serviceFeeKrw;
}
