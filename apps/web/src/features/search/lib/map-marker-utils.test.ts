import type { SearchPropertyCard } from '@housing-platform/types';
import { describe, expect, it } from 'vitest';

import {
  formatMarkerPrice,
  groupByCoord,
  normalizeLatLng,
} from '@/features/search/lib/map-marker-utils';

function buildProperty(overrides: Partial<SearchPropertyCard>): SearchPropertyCard {
  return {
    id: 'property-1',
    title: 'Stay',
    slug: 'stay',
    propertyType: 'studio',
    district: 'Gangnam District, Seoul',
    nearestStationName: null,
    monthlyPriceMin: 500_000,
    coverImageUrl: null,
    coverImageAlt: null,
    tags: [],
    latitude: 37.5,
    longitude: 127.02,
    distanceMeters: null,
    ...overrides,
  };
}

describe('normalizeLatLng', () => {
  it('keeps coordinates that are already in lat/lng order', () => {
    expect(normalizeLatLng(37.5665, 126.978)).toEqual([37.5665, 126.978]);
  });

  it('swaps coordinates when the latitude is out of range', () => {
    expect(normalizeLatLng(126.978, 37.5665)).toEqual([37.5665, 126.978]);
  });
});

describe('groupByCoord', () => {
  it('groups properties sharing a coordinate and orders them cheapest first', () => {
    const groups = groupByCoord([
      buildProperty({ id: 'expensive', monthlyPriceMin: 900_000 }),
      buildProperty({ id: 'cheap', monthlyPriceMin: 300_000 }),
      buildProperty({ id: 'elsewhere', latitude: 37.6, longitude: 127.1 }),
    ]);

    expect(groups.size).toBe(2);
    expect(groups.get('37.500000,127.020000')?.map((property) => property.id)).toEqual([
      'cheap',
      'expensive',
    ]);
    expect(groups.get('37.600000,127.100000')?.map((property) => property.id)).toEqual([
      'elsewhere',
    ]);
  });

  it('treats coordinates differing beyond six decimals as the same spot', () => {
    const groups = groupByCoord([
      buildProperty({ id: 'a', latitude: 37.5000001 }),
      buildProperty({ id: 'b', latitude: 37.5000002 }),
    ]);

    expect(groups.size).toBe(1);
  });
});

describe('formatMarkerPrice', () => {
  it('renders a compact won amount without a trailing space', () => {
    expect(formatMarkerPrice(780_000)).toBe('₩780,000');
  });

  it('truncates fractional won', () => {
    expect(formatMarkerPrice(780_000.9)).toBe('₩780,000');
  });
});
