/**
 * Platforms feature public API
 *
 * Usage:
 *   import { professionalPlatforms, getProfessionalPlatform } from '@/features/platforms';
 */

// ============================================================================
// Model Layer
// ============================================================================

// Types
export type {
  OpenProfessionalPlatform,
  ProfessionalPlatform,
  ProfessionalPlatformKey,
} from './model';

// Constants
export { PLATFORMS_BY_KEY, PROFESSIONAL_PLATFORMS } from './model';

// Utils
export { getProfessionalPlatform, isPlatformOpen } from './model';

/** @deprecated Use PROFESSIONAL_PLATFORMS from './model'. */
export { PROFESSIONAL_PLATFORMS as professionalPlatforms } from './model';
