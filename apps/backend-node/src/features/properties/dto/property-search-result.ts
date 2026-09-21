import type { SearchPropertyCard } from './search-property-card';

export interface PropertySearchResult {
  items: SearchPropertyCard[];
  totalCount: number;
}
