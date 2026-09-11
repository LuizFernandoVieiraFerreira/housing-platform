import {
  CURRENCY_CONFIG,
  KRW_PER_USD,
  type CurrencyCode,
  type LanguageCode,
} from '@/i18n/config';

function convertKrwToCurrency(amountKrw: number, currency: CurrencyCode): number {
  if (currency === 'KRW') {
    return amountKrw;
  }

  return amountKrw / KRW_PER_USD;
}

function compactFormat(amount: number, currency: CurrencyCode): string {
  const config = CURRENCY_CONFIG[currency];

  if (currency === 'KRW') {
    if (amount >= 1_000_000) {
      return `${config.symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }

    if (amount >= 1_000) {
      return `${config.symbol}${Math.round(amount / 1_000)}K`;
    }

    return `${config.symbol}${Math.trunc(amount).toLocaleString(config.locale)}`;
  }

  if (amount >= 1_000) {
    return `${config.symbol}${(amount / 1_000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPrice(
  amountKrw: number,
  currency: CurrencyCode,
  options?: { compact?: boolean },
): string {
  const normalizedKrw = Math.trunc(amountKrw);
  const converted = convertKrwToCurrency(normalizedKrw, currency);
  const config = CURRENCY_CONFIG[currency];

  if (options?.compact) {
    return compactFormat(converted, currency);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: currency === 'USD' ? 0 : 0,
  }).format(converted);
}

export function formatMarkerPrice(amountKrw: number, currency: CurrencyCode): string {
  return `${formatPrice(amountKrw, currency, { compact: false })}`;
}

export function formatDate(value: string | Date, language: LanguageCode): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  const locale = language === 'KO' ? 'ko-KR' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
