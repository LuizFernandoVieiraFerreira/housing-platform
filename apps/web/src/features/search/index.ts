/**
 * Search feature public API
 *
 * Usage:
 *   import { usePropertySearch, buildSearchParams, searchKeys } from '@/features/search';
 */

// Query keys (colocated with feature)
export { searchKeys } from './keys';

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
