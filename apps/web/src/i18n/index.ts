import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  fromI18nextLang,
  toI18nextLang,
  type LanguageCode,
} from '@/i18n/config';
import enAccount from '@/i18n/locales/en/account.json';
import enAuth from '@/i18n/locales/en/auth.json';
import enBooking from '@/i18n/locales/en/booking.json';
import enCommon from '@/i18n/locales/en/common.json';
import enPlatforms from '@/i18n/locales/en/platforms.json';
import enSearch from '@/i18n/locales/en/search.json';
import koAccount from '@/i18n/locales/ko/account.json';
import koAuth from '@/i18n/locales/ko/auth.json';
import koBooking from '@/i18n/locales/ko/booking.json';
import koCommon from '@/i18n/locales/ko/common.json';
import koPlatforms from '@/i18n/locales/ko/platforms.json';
import koSearch from '@/i18n/locales/ko/search.json';

export const I18N_NAMESPACES = [
  'common',
  'auth',
  'search',
  'booking',
  'account',
  'platforms',
] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    search: enSearch,
    booking: enBooking,
    account: enAccount,
    platforms: enPlatforms,
  },
  ko: {
    common: koCommon,
    auth: koAuth,
    search: koSearch,
    booking: koBooking,
    account: koAccount,
    platforms: koPlatforms,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: toI18nextLang(DEFAULT_LANGUAGE),
    supportedLngs: SUPPORTED_LANGUAGES.map(toI18nextLang),
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    ns: I18N_NAMESPACES,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language.split('-')[0] ?? 'en';
});

document.documentElement.lang = (i18n.resolvedLanguage ?? i18n.language).split('-')[0] ?? 'en';

export function getCurrentLanguage(): LanguageCode {
  return fromI18nextLang(i18n.resolvedLanguage ?? i18n.language);
}

export async function changeLanguage(lang: LanguageCode): Promise<void> {
  await i18n.changeLanguage(toI18nextLang(lang));
}

export default i18n;
