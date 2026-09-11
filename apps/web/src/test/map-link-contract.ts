import { screen } from '@testing-library/react';
import type { AccommodationType } from '@housing-platform/types';
import { expect } from 'vitest';

import { parseAiSearchParams, parseSearchParams } from '@/features/search/lib/search-params';

export function parseMapHref(href: string) {
  const url = new URL(href, 'http://localhost');

  return {
    pathname: url.pathname,
    search: url.search,
    searchParams: url.searchParams,
    filters: parseSearchParams(url.searchParams),
    ai: parseAiSearchParams(url.searchParams),
  };
}

/** Every /map link must use the canonical query param names the map parser understands. */
export function expectMapHrefContract(href: string | null) {
  expect(href, 'map navigation links must define an href').toBeTruthy();

  const { pathname, search, searchParams, filters, ai } = parseMapHref(href!);

  expect(pathname).toBe('/map');
  expect(search).not.toMatch(/propertyType=/);

  if (searchParams.has('type')) {
    expect(searchParams.get('type')).toBe(filters.propertyType);
  }

  if (searchParams.has('aiq')) {
    expect(searchParams.get('aiq')).toBe(ai.aiQuery);
  }

  return { filters, ai };
}

export function getMapLinkForPropertyType(propertyType: AccommodationType) {
  const link = screen.getAllByRole('link').find((element) => {
    const href = element.getAttribute('href');
    return href?.startsWith('/map') && href.includes(`type=${propertyType}`);
  });

  expect(link, `expected a /map link with type=${propertyType}`).toBeTruthy();

  return link!;
}

export function expectMapLinkForPropertyType(propertyType: AccommodationType) {
  const link = getMapLinkForPropertyType(propertyType);
  const { filters } = expectMapHrefContract(link.getAttribute('href'));

  expect(filters.propertyType).toBe(propertyType);

  return link;
}
