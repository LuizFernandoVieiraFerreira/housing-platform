/**
 * Platforms feature public API
 *
 * Usage:
 *   import { PROFESSIONAL_PLATFORMS, getProfessionalPlatform } from '@/features/platforms';
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

