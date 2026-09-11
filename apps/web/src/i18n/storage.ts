import { DEFAULT_CURRENCY, CURRENCY_STORAGE_KEY, isCurrencyCode, type CurrencyCode } from '@/i18n/config';

export { CURRENCY_STORAGE_KEY };

export function getStoredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') {
    return DEFAULT_CURRENCY;
  }

  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return isCurrencyCode(stored) ? stored : DEFAULT_CURRENCY;
}
