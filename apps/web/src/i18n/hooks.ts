import { useCallback, useSyncExternalStore } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import i18n, { changeLanguage, getCurrentLanguage } from '@/i18n/index';
import type {
  TranslationNamespace,
  TranslationKey,
  CommonKey,
} from '@/i18n/types';

// ============================================================================
// Language Hook
// ============================================================================

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

// ============================================================================
// Typed Translation Hook
// ============================================================================

/**
 * Type-safe translation function for a specific namespace.
 *
 * Provides autocomplete for translation keys and compile-time validation.
 */
export type TypedTFunction<NS extends TranslationNamespace> = {
  (key: TranslationKey<NS>, options?: Record<string, unknown>): string;
  <K extends TranslationKey<NS>>(key: K, options?: Record<string, unknown>): string;
};

/**
 * Hook result for typed translations.
 */
export interface UseTypedTranslationResult<NS extends TranslationNamespace> {
  /** Type-safe translation function */
  t: TypedTFunction<NS>;
  /** Whether translations are ready */
  ready: boolean;
}

/**
 * Type-safe useTranslation hook with autocomplete for translation keys.
 *
 * @example
 * const { t } = useTypedTranslation('auth');
 * t('login.title'); // ✓ autocomplete + type-checked
 * t('login.invalid'); // ✗ compile error
 */
export function useTypedTranslation<NS extends TranslationNamespace>(
  ns: NS,
): UseTypedTranslationResult<NS> {
  const { t, ready } = useI18nextTranslation(ns);

  return {
    t: t as unknown as TypedTFunction<NS>,
    ready,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get a localized property type label.
 *
 * @example
 * const label = usePropertyTypeLabel('share-house'); // "Share-house"
 */
export function usePropertyTypeLabel(propertyType: string): string {
  const key = `propertyTypes.${propertyType}` as CommonKey;
  return i18n.t(key, { ns: 'common', defaultValue: propertyType });
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export the standard hook for gradual migration
export { useTranslation } from 'react-i18next';

// Re-export types for consumers
export type {
  TranslationNamespace,
  TranslationKey,
  CommonKey,
  AuthKey,
  HomeKey,
  SearchKey,
  BookingKey,
  AccountKey,
  PlatformsKey,
} from '@/i18n/types';
