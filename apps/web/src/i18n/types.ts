/**
 * Type-safe translation utilities.
 *
 * Provides compile-time checking for translation keys.
 */

import type enAccount from '@/i18n/locales/en/account.json';
import type enAuth from '@/i18n/locales/en/auth.json';
import type enBooking from '@/i18n/locales/en/booking.json';
import type enCommon from '@/i18n/locales/en/common.json';
import type enHome from '@/i18n/locales/en/home.json';
import type enPlatforms from '@/i18n/locales/en/platforms.json';
import type enSearch from '@/i18n/locales/en/search.json';

// ============================================================================
// Resource Types
// ============================================================================

/**
 * All translation resources by namespace.
 */
export interface TranslationResources {
  common: typeof enCommon;
  auth: typeof enAuth;
  home: typeof enHome;
  search: typeof enSearch;
  booking: typeof enBooking;
  account: typeof enAccount;
  platforms: typeof enPlatforms;
}

/**
 * All available namespaces.
 */
export type TranslationNamespace = keyof TranslationResources;

/**
 * Default namespace for translations.
 */
export type DefaultNamespace = 'common';

// ============================================================================
// Nested Key Types
// ============================================================================

/**
 * Recursively builds dot-notation keys from a nested object type.
 *
 * @example
 * type T = { a: { b: string; c: { d: string } } };
 * type Keys = NestedKeyOf<T>; // 'a' | 'a.b' | 'a.c' | 'a.c.d'
 */
export type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? // Include both the parent key and nested keys
          | `${Prefix}${K}`
            | NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/**
 * Type-safe translation keys for a specific namespace.
 */
export type TranslationKey<NS extends TranslationNamespace> = NestedKeyOf<
  TranslationResources[NS]
>;

// ============================================================================
// Namespace-specific Key Types (for autocomplete)
// ============================================================================

export type CommonKey = TranslationKey<'common'>;
export type AuthKey = TranslationKey<'auth'>;
export type HomeKey = TranslationKey<'home'>;
export type SearchKey = TranslationKey<'search'>;
export type BookingKey = TranslationKey<'booking'>;
export type AccountKey = TranslationKey<'account'>;
export type PlatformsKey = TranslationKey<'platforms'>;

// ============================================================================
// Value Extraction Types
// ============================================================================

/**
 * Extract the value type at a nested path.
 */
export type ValueAt<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ValueAt<T[K], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

/**
 * Get the value type for a translation key.
 */
export type TranslationValue<
  NS extends TranslationNamespace,
  Key extends TranslationKey<NS>,
> = ValueAt<TranslationResources[NS], Key>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a string is a valid translation key for a namespace.
 * (Runtime check - for cases where you have dynamic keys)
 */
export function isValidKey<NS extends TranslationNamespace>(
  _ns: NS,
  _key: string,
): _key is TranslationKey<NS> {
  // At runtime, we can't fully validate nested keys without the full JSON
  // This is mainly for type narrowing in TypeScript
  return typeof _key === 'string' && _key.length > 0;
}
