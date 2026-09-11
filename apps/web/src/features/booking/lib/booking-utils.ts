import type { BookingStatus } from '@housing-platform/types';

import { formatDate, formatPrice } from '@/i18n/formatters';
import { getCurrentLanguage } from '@/i18n/index';
import type { CurrencyCode, LanguageCode } from '@/i18n/config';
import { getStoredCurrency } from '@/i18n/storage';
import i18n from '@/i18n/index';

export function formatKrw(amount: number, currency: CurrencyCode = getStoredCurrency()): string {
  return formatPrice(amount, currency);
}

export function formatBookingDate(
  value: string,
  language: LanguageCode = getCurrentLanguage(),
): string {
  return formatDate(value, language);
}

export function getBookingStatusLabel(status: BookingStatus): string {
  return i18n.t(`status.${status}`, { ns: 'booking', defaultValue: status });
}

export function canCancelBooking(status: BookingStatus): boolean {
  return status === 'requested' || status === 'pending_payment';
}

export function canPayBooking(status: BookingStatus): boolean {
  return status === 'pending_payment' || status === 'payment_failed';
}

export function isHoldExpired(holdExpiresAt: string | null): boolean {
  if (!holdExpiresAt) {
    return false;
  }

  return new Date(holdExpiresAt).getTime() <= Date.now();
}

export function getBookingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message.includes('conflict')) {
      return i18n.t('errors.datesUnavailable', { ns: 'booking' });
    }

    return error.message;
  }

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
