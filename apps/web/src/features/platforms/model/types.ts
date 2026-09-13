/**
 * Platforms feature types.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Keys for available professional platforms.
 */
export type ProfessionalPlatformKey = 'host' | 'photographer' | 'agent';

/**
 * Configuration for a professional platform.
 */
export interface ProfessionalPlatform {
  key: ProfessionalPlatformKey;
  icon: LucideIcon;
  /** Public marketing page. The bare `/host` paths belong to the signed-in portals. */
  landingPath: string;
  /** Unset until the platform has its own login page; the landing page then collects interest instead. */
  loginPath?: string;
  signupPath?: string;
}

/**
 * A platform whose sign-in surfaces exist, so the landing page can link straight into them.
 */
export interface OpenProfessionalPlatform extends ProfessionalPlatform {
  loginPath: string;
  signupPath: string;
}
