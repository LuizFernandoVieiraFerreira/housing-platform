/**
 * Booking utilities with i18n and formatting support.
 *
 * This file contains utilities that depend on i18n or React context.
 * Pure domain utilities live in model/utils.ts.
 */

import type { BookingStatus } from '@housing-platform/types';

import { formatDate, formatPrice } from '@/i18n/formatters';
import { getCurrentLanguage } from '@/i18n/index';
import type { CurrencyCode, LanguageCode } from '@/i18n/config';
import { getStoredCurrency } from '@/i18n/storage';
import i18n from '@/i18n/index';
import { AppError, getUserErrorMessage } from '@/shared/lib/result';

// Re-export pure utilities from model layer for backward compatibility
export { canCancelBooking, canPayBooking, isHoldExpired } from '../model';

/**
 * Format currency amount for display.
 */
export function formatKrw(amount: number, currency: CurrencyCode = getStoredCurrency()): string {
  return formatPrice(amount, currency);
}

/**
 * Format booking date for display.
 */
export function formatBookingDate(
  value: string,
  language: LanguageCode = getCurrentLanguage(),
): string {
  return formatDate(value, language);
}

/**
 * Get translated status label.
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  return i18n.t(`status.${status}`, { ns: 'booking', defaultValue: status });
}

/**
 * Extract a user-friendly error message from a booking error.
 *
 * Uses the Result pattern's AppError for consistent error handling,
 * with special handling for booking-specific error codes.
 */
export function getBookingErrorMessage(error: unknown, fallback: string): string {
  // Handle AppError with booking-specific codes
  if (error instanceof AppError) {
    // Map booking-specific error codes to translated messages
    if (error.is('BOOKING_UNAVAILABLE')) {
      return i18n.t('errors.datesUnavailable', { ns: 'booking' });
    }
    if (error.is('HOLD_EXPIRED')) {
      return i18n.t('errors.holdExpired', { ns: 'booking' });
    }
    if (error.is('PAYMENT_FAILED')) {
      return i18n.t('errors.paymentFailed', { ns: 'booking' });
    }
    return getUserErrorMessage(error, fallback);
  }

  // Handle legacy Error objects
  if (error instanceof Error) {
    if (error.message.includes('conflict')) {
      return i18n.t('errors.datesUnavailable', { ns: 'booking' });
    }
    return error.message;
  }

  // Handle plain objects with message property
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}
