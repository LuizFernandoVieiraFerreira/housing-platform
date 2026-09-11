import { describe, expect, it } from 'vitest';

import {
  buildAiSearchParams,
  buildSearchParams,
  filtersToRpcPayload,
  parseAiSearchParams,
  parseSearchParams,
  SEOUL_CENTER,
} from '@/features/search/lib/search-params';

describe('parseSearchParams', () => {
  it('returns Seoul defaults for empty params', () => {
    expect(parseSearchParams(new URLSearchParams())).toEqual({
      guests: 1,
      sort: 'recommended',
      ...SEOUL_CENTER,
    });
  });

  it('parses supported filter params', () => {
    const params = new URLSearchParams({
      q: 'Hongdae',
      type: 'studio',
      checkIn: '2026-09-01',
      checkOut: '2026-10-01',
      guests: '2',
      priceMin: '500000',
      priceMax: '900000',
      sort: 'price_asc',
      centerLat: '37.55',
      centerLng: '126.98',
    });

    expect(parseSearchParams(params)).toEqual({
      guests: 2,
      sort: 'price_asc',
      centerLat: 37.55,
      centerLng: 126.98,
      query: 'Hongdae',
      propertyType: 'studio',
      checkIn: '2026-09-01',
      checkOut: '2026-10-01',
      priceMin: 500000,
      priceMax: 900000,
    });
  });

  it('falls back to defaults when params are invalid', () => {
    const params = new URLSearchParams({
      guests: 'not-a-number',
      sort: 'invalid-sort',
    });

    expect(parseSearchParams(params)).toEqual({
      guests: 1,
      sort: 'recommended',
      ...SEOUL_CENTER,
    });
  });
});

describe('buildSearchParams', () => {
  it('round-trips parsed filters', () => {
    const filters = parseSearchParams(
      new URLSearchParams({
        q: 'Gangnam',
        type: 'share-house',
        guests: '3',
        sort: 'price_desc',
      }),
    );

    expect(buildSearchParams(filters).toString()).toBe(
      'q=Gangnam&type=share-house&guests=3&sort=price_desc&centerLat=37.5665&centerLng=126.978',
    );
  });

  it('omits recommended sort from the URL', () => {
    const params = buildSearchParams({
      guests: 1,
      sort: 'recommended',
      centerLat: SEOUL_CENTER.centerLat,
      centerLng: SEOUL_CENTER.centerLng,
    });

    expect(params.get('sort')).toBeNull();
    expect(params.get('guests')).toBe('1');
  });
});

describe('parseAiSearchParams', () => {
  it('parses AI query and reference property params', () => {
    expect(parseAiSearchParams(new URLSearchParams('aiq=quiet+studio&ref=property-123'))).toEqual({
      aiQuery: 'quiet studio',
      referencePropertyId: 'property-123',
    });
  });

  it('returns an empty AI query when absent', () => {
    expect(parseAiSearchParams(new URLSearchParams())).toEqual({
      aiQuery: '',
      referencePropertyId: undefined,
    });
  });
});

describe('buildAiSearchParams', () => {
  it('builds AI search params and removes classic query param', () => {
    const params = buildAiSearchParams({
      aiQuery: ' near Hongdae ',
      referencePropertyId: 'property-123',
      filters: {
        guests: 2,
        sort: 'recommended',
        query: 'should-be-removed',
        centerLat: SEOUL_CENTER.centerLat,
        centerLng: SEOUL_CENTER.centerLng,
      },
    });

    expect(params.get('aiq')).toBe('near Hongdae');
    expect(params.get('ref')).toBe('property-123');
    expect(params.get('q')).toBeNull();
    expect(params.get('guests')).toBe('2');
  });
});

describe('filtersToRpcPayload', () => {
  it('maps frontend filters to RPC payload keys', () => {
    expect(
      filtersToRpcPayload({
        query: 'Itaewon',
        propertyType: 'studio',
        checkIn: '2026-09-01',
        checkOut: '2026-10-01',
        guests: 2,
        priceMin: 400000,
        priceMax: 800000,
        sort: 'price_asc',
        centerLat: 37.5,
        centerLng: 127.0,
        amenitySlugs: ['wifi'],
        maxStationWalkMin: 10,
        excludePropertyIds: ['property-1'],
      }),
    ).toEqual({
      sort: 'price_asc',
      query: 'Itaewon',
      property_type: 'studio',
      check_in: '2026-09-01',
      check_out: '2026-10-01',
      guests: 2,
      price_min: 400000,
      price_max: 800000,
      center_lat: 37.5,
      center_lng: 127,
      amenity_slugs: ['wifi'],
      max_station_walk_min: 10,
      exclude_property_ids: ['property-1'],
    });
  });

  it('requires all bounds before sending map bounds to RPC', () => {
    expect(
      filtersToRpcPayload({
        guests: 1,
        sort: 'recommended',
        centerLat: SEOUL_CENTER.centerLat,
        centerLng: SEOUL_CENTER.centerLng,
        north: 37.6,
        south: 37.5,
        east: 127.1,
      }),
    ).toEqual({
      sort: 'recommended',
      guests: 1,
      center_lat: SEOUL_CENTER.centerLat,
      center_lng: SEOUL_CENTER.centerLng,
    });
  });
});
