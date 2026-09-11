export type LanguageCode = 'EN' | 'KO';

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['EN', 'KO'];

export const DEFAULT_LANGUAGE: LanguageCode = 'EN';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  EN: 'English',
  KO: '한국어',
};

export const LANGUAGE_SHORT_LABELS: Record<LanguageCode, string> = {
  EN: 'English',
  KO: '한국어',
};

export type CurrencyCode = 'KRW' | 'USD';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['KRW', 'USD'];

export const DEFAULT_CURRENCY: CurrencyCode = 'KRW';

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  KRW: 'KRW',
  USD: 'USD',
};

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { code: CurrencyCode; symbol: string; locale: string }
> = {
  KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
};

/** Static display conversion rate (KRW per 1 USD). */
export const KRW_PER_USD = 1350;

export const LANGUAGE_STORAGE_KEY = 'housing-platform:language';
export const CURRENCY_STORAGE_KEY = 'housing-platform:currency';

export function toI18nextLang(lang: LanguageCode): string {
  return lang.toLowerCase();
}

export function fromI18nextLang(tag: string | undefined): LanguageCode {
  if (!tag) {
    return DEFAULT_LANGUAGE;
  }

  const primaryPart = tag.split('-')[0];
  if (!primaryPart) {
    return DEFAULT_LANGUAGE;
  }

  const primary = primaryPart.toUpperCase() as LanguageCode;
  return SUPPORTED_LANGUAGES.includes(primary) ? primary : DEFAULT_LANGUAGE;
}

export function fromProfileLanguage(value: string | undefined): LanguageCode {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'ko' || normalized === 'kr' || normalized === 'korean') {
    return 'KO';
  }

  return 'EN';
}

export function toProfileLanguage(lang: LanguageCode): string {
  return lang === 'KO' ? 'ko' : 'en';
}

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return value === 'KRW' || value === 'USD';
}
