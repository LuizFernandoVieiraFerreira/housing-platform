import type { AccommodationType, PropertySearchFilters } from '@housing-platform/types';
import { Button, FilterChip } from '@housing-platform/ui';

import { accommodationTypeOptions, sortOptions } from '@/features/search/lib/filter-options';

interface MapSearchToolbarProps {
  filters: PropertySearchFilters;
  totalCount: number;
  isLoading: boolean;
  onOpenFilters: () => void;
  onPropertyTypeChange: (propertyType: AccommodationType | '') => void;
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return 'Select dates';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateRange(filters: PropertySearchFilters): string {
  if (filters.checkIn && filters.checkOut) {
    return `${formatDateLabel(filters.checkIn)} – ${formatDateLabel(filters.checkOut)}`;
  }

  if (filters.checkIn) {
    return `From ${formatDateLabel(filters.checkIn)}`;
  }

  return 'Select dates';
}

export function MapSearchToolbar({
  filters,
  totalCount,
  isLoading,
  onOpenFilters,
  onPropertyTypeChange,
}: MapSearchToolbarProps) {
  const activeType = filters.propertyType ?? '';
  const sortLabel =
    sortOptions.find((option) => option.value === (filters.sort ?? 'recommended'))?.label ??
    'Recommended';

  return (
    <div className="border-surface-subtle shrink-0 border-b bg-white">
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Button type="button" variant="secondary" size="sm" onClick={onOpenFilters}>
          {filters.query?.trim() || 'Search locations'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenFilters}>
          {formatDateRange(filters)}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenFilters}>
          Filters
        </Button>
      </div>

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3">
        {accommodationTypeOptions.map((option) => (
          <FilterChip
            key={option.value || 'all'}
            active={activeType === option.value}
            onClick={() => onPropertyTypeChange(option.value)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>

      <div className="text-ink-muted flex items-center justify-between gap-3 px-4 pb-3 text-sm">
        <p>
          {isLoading
            ? 'Searching...'
            : `${totalCount} accommodation${totalCount === 1 ? '' : 's'}`}
        </p>
        <p className="text-ink font-medium">{sortLabel}</p>
      </div>
    </div>
  );
}
