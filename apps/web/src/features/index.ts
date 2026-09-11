/**
 * Features Public API Index
 *
 * This is a convenience re-export of all feature modules.
 * Prefer importing directly from the feature module for better tree-shaking:
 *
 *   import { useAuth } from '@/features/auth';
 *
 * Instead of:
 *
 *   import { useAuth } from '@/features';
 *
 * See FEATURE_STRUCTURE.md for the complete architecture documentation.
 */

// Re-export all features for convenience
export * from './account';
export * from './admin';
export * from './auth';
export * from './booking';
export * from './checkout';
export * from './home';
export * from './host';
export * from './listings';
export * from './notifications';
export * from './platforms';
export * from './search';
export * from './support';
