import type { PropertySearchFilters } from '@housing-platform/types';
import { FilterChip } from '@housing-platform/ui';

import { ACCOMMODATION_TYPE_OPTIONS } from '@/features/search/model';
import { useFormatPrice } from '@/i18n/CurrencyProvider';

interface InterpretedFiltersChipsProps {
  filters: PropertySearchFilters;
  explanation?: string;
  fallbackUsed?: boolean;
}

export function InterpretedFiltersChips({
  filters,
  explanation,
  fallbackUsed,
}: InterpretedFiltersChipsProps) {
  const formatPrice = useFormatPrice();
  const chips: string[] = [];

  if (filters.propertyType) {
    const label =
      ACCOMMODATION_TYPE_OPTIONS.find((option) => option.value === filters.propertyType)?.label ??
      filters.propertyType;
    chips.push(label);
  }

  if (filters.query) {
    chips.push(filters.query);
  }

  if (filters.priceMax != null) {
    chips.push(`≤ ${formatPrice(filters.priceMax)}/mo`);
  }

  if (filters.priceMin != null) {
    chips.push(`≥ ${formatPrice(filters.priceMin)}/mo`);
  }

  if (filters.amenitySlugs?.length) {
    chips.push(...filters.amenitySlugs.map((slug) => slug.replace('-', ' ')));
  }

  if (filters.maxStationWalkMin != null) {
    chips.push(`≤ ${filters.maxStationWalkMin} min to station`);
  }

  if (filters.guests != null && filters.guests > 1) {
    chips.push(`${filters.guests} guests`);
  }

  if (chips.length === 0 && !explanation) {
    return null;
  }

  return (
    <div className="border-surface-subtle border-b bg-white px-4 py-3">
      {explanation ? (
        <p className="text-ink-muted text-sm">
          {explanation}
          {fallbackUsed ? ' Keyword fallback was used.' : null}
        </p>
      ) : null}
      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <FilterChip key={chip} active>
              {chip}
            </FilterChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
