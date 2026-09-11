import type { SearchPropertyCard } from '@housing-platform/types';

import { formatMarkerPrice as formatMarkerPriceValue } from '@/i18n/formatters';
import type { CurrencyCode } from '@/i18n/config';
import { getStoredCurrency } from '@/i18n/storage';

const COORD_PRECISION = 6;

export const MARKER_STACK_OFFSET_PX = 34;

/**
 * Guards against latitude/longitude arriving in the opposite order: no Korean
 * latitude exceeds 90, so a value above that can only be a longitude.
 */
export function normalizeLatLng(latitude: number, longitude: number): [number, number] {
  return latitude > 90 ? [longitude, latitude] : [latitude, longitude];
}

/**
 * Buckets properties that sit at the same coordinate so the map can stack their
 * markers instead of drawing them on top of each other. Each bucket is ordered
 * cheapest first, which keeps the stack order stable between renders.
 */
export function groupByCoord(properties: SearchPropertyCard[]): Map<string, SearchPropertyCard[]> {
  const groups = new Map<string, SearchPropertyCard[]>();

  for (const property of properties) {
    const key = `${property.latitude.toFixed(COORD_PRECISION)},${property.longitude.toFixed(COORD_PRECISION)}`;
    const group = groups.get(key);

    if (group) {
      group.push(property);
      continue;
    }

    groups.set(key, [property]);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.monthlyPriceMin - b.monthlyPriceMin);
  }

  return groups;
}

export function formatMarkerPrice(
  amountKrw: number,
  currency: CurrencyCode = getStoredCurrency(),
): string {
  return formatMarkerPriceValue(amountKrw, currency);
}
