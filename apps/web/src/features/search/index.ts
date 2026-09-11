/**
 * Search feature public API
 *
 * Usage:
 *   import { usePropertySearch, buildSearchParams } from '@/features/search';
 */

// Hooks
export { usePropertySearch } from './hooks/usePropertySearch';
export { usePropertyDetail } from './hooks/usePropertyDetail';

// Library utilities
export {
  buildSearchParams,
  buildAiSearchParams,
  SEOUL_CENTER,
} from './lib/search-params';

// Components
export { NaverPropertyMap } from './components/NaverPropertyMap';
