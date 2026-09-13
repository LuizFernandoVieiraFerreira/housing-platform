/**
 * Platforms feature utility functions.
 */

import type { OpenProfessionalPlatform, ProfessionalPlatform, ProfessionalPlatformKey } from './types';
import { PLATFORMS_BY_KEY } from './constants';

/**
 * Get platform configuration by key.
 */
export function getProfessionalPlatform(key: ProfessionalPlatformKey): ProfessionalPlatform {
  return PLATFORMS_BY_KEY[key];
}

/**
 * Check if a platform has sign-in surfaces available.
 */
export function isPlatformOpen(
  platform: ProfessionalPlatform,
): platform is OpenProfessionalPlatform {
  return Boolean(platform.loginPath && platform.signupPath);
}
