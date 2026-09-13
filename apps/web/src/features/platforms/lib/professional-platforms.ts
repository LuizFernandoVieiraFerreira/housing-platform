/**
 * Professional platforms utilities.
 *
 * Re-exports from model layer for backward compatibility.
 */

export type {
  OpenProfessionalPlatform,
  ProfessionalPlatform,
  ProfessionalPlatformKey,
} from '../model';

export {
  PROFESSIONAL_PLATFORMS as professionalPlatforms,
  getProfessionalPlatform,
  isPlatformOpen,
} from '../model';
