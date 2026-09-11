import { useCallback, useSyncExternalStore } from 'react';

import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import i18n, { changeLanguage, getCurrentLanguage } from '@/i18n/index';

function subscribeToLanguage(listener: () => void): () => void {
  i18n.on('languageChanged', listener);
  return () => {
    i18n.off('languageChanged', listener);
  };
}

export interface UseLanguageResult {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
}

export function useLanguage(): UseLanguageResult {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getCurrentLanguage,
    () => DEFAULT_LANGUAGE,
  );

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    await changeLanguage(lang);
  }, []);

  return { language, setLanguage };
}

export function usePropertyTypeLabel(propertyType: string): string {
  return i18n.t(`propertyTypes.${propertyType}`, { ns: 'common', defaultValue: propertyType });
}
