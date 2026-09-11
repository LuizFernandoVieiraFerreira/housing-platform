import type { AccommodationType, PropertySearchSort } from '@housing-platform/types';

export const accommodationTypeOptions = [
  { value: '', label: 'All' },
  { value: 'share-house', label: 'Share-house' },
  { value: 'studio', label: 'Studio' },
  { value: 'micro-studio', label: 'Micro Studio' },
  { value: 'multi-bedroom', label: 'Multi-bedroom' },
] as const satisfies ReadonlyArray<{ value: AccommodationType | ''; label: string }>;

export const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'distance', label: 'Distance' },
] as const satisfies ReadonlyArray<{ value: PropertySearchSort; label: string }>;
