import { Injectable } from '@nestjs/common';

import { BadRequestError } from '../../shared/errors';
import { StorageUrlResolver } from '../../shared/storage/storage-url.resolver';
import type { PropertySearchQuery } from './dto/property-search-query';
import type { PropertySearchResult } from './dto/property-search-result';
import { PropertySearchSort } from './dto/property-search-sort';
import { mapSearchPropertyCard } from './mappers/property.mapper';
import { PropertyRepository } from './property.repository';
import { toSearchCriteria } from './property-search.criteria';

@Injectable()
export class PropertySearchService {
  constructor(
    private readonly repository: PropertyRepository,
    private readonly storage: StorageUrlResolver,
  ) {}

  async search(query: PropertySearchQuery): Promise<PropertySearchResult> {
    this.validateSearchQuery(query);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const criteria = toSearchCriteria({
      ...query,
      sort: query.sort ?? PropertySearchSort.Recommended,
      limit,
      offset,
    });

    const rows = await this.repository.search(criteria, limit, offset);
    const totalCount = rows[0]?.totalCount ?? 0;
    const items = rows.map((row) => mapSearchPropertyCard(row, this.storage));

    return { items, totalCount };
  }

  private validateSearchQuery(query: PropertySearchQuery): void {
    if (
      query.priceMin != null &&
      query.priceMax != null &&
      query.priceMax < query.priceMin
    ) {
      throw new BadRequestError(
        'priceMax must be greater than or equal to priceMin',
      );
    }

    if (query.checkIn && query.checkOut && query.checkOut <= query.checkIn) {
      throw new BadRequestError('checkOut must be after checkIn');
    }

    if (query.maxStationWalkMin != null && query.maxStationWalkMin <= 0) {
      throw new BadRequestError('maxStationWalkMin must be greater than 0');
    }
  }
}

export function parsePropertySearchQuery(
  raw: Record<string, string | string[] | undefined>,
): PropertySearchQuery {
  const first = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const list = (value: string | string[] | undefined): string[] | undefined => {
    if (value == null) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => item.split(',')).filter(Boolean);
    }
    return value.split(',').filter(Boolean);
  };

  const intOrNull = (value: string | undefined): number | null => {
    if (value == null || value.trim() === '') {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const floatOrNull = (value: string | undefined): number | null => {
    if (value == null || value.trim() === '') {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const sortValue = first(raw.sort);
  const sort =
    sortValue &&
    Object.values(PropertySearchSort).includes(sortValue as PropertySearchSort)
      ? (sortValue as PropertySearchSort)
      : PropertySearchSort.Recommended;

  return {
    query: first(raw.query) ?? null,
    propertyType: first(raw.propertyType) as PropertySearchQuery['propertyType'],
    checkIn: first(raw.checkIn) ?? null,
    checkOut: first(raw.checkOut) ?? null,
    guests: intOrNull(first(raw.guests)),
    priceMin: intOrNull(first(raw.priceMin)),
    priceMax: intOrNull(first(raw.priceMax)),
    sort,
    centerLat: floatOrNull(first(raw.centerLat)),
    centerLng: floatOrNull(first(raw.centerLng)),
    north: floatOrNull(first(raw.north)),
    south: floatOrNull(first(raw.south)),
    east: floatOrNull(first(raw.east)),
    west: floatOrNull(first(raw.west)),
    amenitySlugs: list(raw.amenitySlugs) ?? null,
    maxStationWalkMin: intOrNull(first(raw.maxStationWalkMin)),
    excludePropertyIds: list(raw.excludePropertyIds) ?? null,
    limit: intOrNull(first(raw.limit)) ?? 20,
    offset: intOrNull(first(raw.offset)) ?? 0,
  };
}
