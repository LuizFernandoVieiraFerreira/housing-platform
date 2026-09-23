import type {
  AccommodationType,
  PropertySearchFilters,
  PropertySearchSort,
} from '@housing-platform/types';
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@housing-platform/ui';
import { useState, type FormEvent } from 'react';

import { ACCOMMODATION_TYPE_OPTIONS, SORT_OPTIONS } from '@/features/search/model';
import { track } from '@/shared/analytics';

interface PropertySearchFormProps {
  filters: PropertySearchFilters;
  onSubmit: (filters: PropertySearchFilters) => void;
  variant?: 'default' | 'modal';
}

export function PropertySearchForm({
  filters,
  onSubmit,
  variant = 'default',
}: PropertySearchFormProps) {
  const [query, setQuery] = useState(filters.query ?? '');
  const [propertyType, setPropertyType] = useState<AccommodationType | ''>(
    filters.propertyType ?? '',
  );
  const [checkIn, setCheckIn] = useState(filters.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(filters.checkOut ?? '');
  const [guests, setGuests] = useState(String(filters.guests ?? 1));
  const [priceMin, setPriceMin] = useState(
    filters.priceMin != null ? String(filters.priceMin) : '',
  );
  const [priceMax, setPriceMax] = useState(
    filters.priceMax != null ? String(filters.priceMax) : '',
  );
  const [sort, setSort] = useState<PropertySearchSort>(filters.sort ?? 'recommended');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submittedFilters = {
      ...filters,
      query: query.trim() || undefined,
      propertyType: propertyType || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: Number(guests) || 1,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
    };

    // Track search - result_count will be 0 since we don't have results yet
    // The actual result count is tracked in the search results component
    track({
      name: 'search_submitted',
      properties: {
        query: submittedFilters.query,
        property_type: submittedFilters.propertyType,
        has_date_filter: Boolean(submittedFilters.checkIn || submittedFilters.checkOut),
        has_price_filter: Boolean(submittedFilters.priceMin || submittedFilters.priceMax),
        result_count: 0, // Unknown at submit time
      },
    });

    onSubmit(submittedFilters);
  };

  const isModal = variant === 'modal';

  const form = (
    <form onSubmit={handleSubmit} className={isModal ? 'space-y-4' : undefined}>
      <div className={`grid gap-3 ${isModal ? '' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search district, station, or tag"
          aria-label="Search locations"
        />
        <Input
          type="date"
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          aria-label="Check in"
        />
        <Input
          type="date"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          aria-label="Check out"
        />
        <Input
          type="number"
          min={1}
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          aria-label="Guests"
        />
      </div>

      <div
        className={`grid gap-3 ${isModal ? 'sm:grid-cols-2' : 'mt-3 md:grid-cols-2 xl:grid-cols-4'}`}
      >
        <FormField label="Type" htmlFor="property-type">
          <Select
            value={propertyType || 'all'}
            onValueChange={(value) =>
              setPropertyType(value === 'all' ? '' : (value as AccommodationType))
            }
          >
            <SelectTrigger id="property-type" className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {ACCOMMODATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <Input
          type="number"
          min={0}
          step={50000}
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
          placeholder="Min monthly price (KRW)"
          aria-label="Minimum price"
        />
        <Input
          type="number"
          min={0}
          step={50000}
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
          placeholder="Max monthly price (KRW)"
          aria-label="Maximum price"
        />
        <FormField label="Sort" htmlFor="sort">
          <Select value={sort} onValueChange={(value) => setSort(value as PropertySearchSort)}>
            <SelectTrigger id="sort" className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className={isModal ? 'flex justify-end gap-2 pt-2' : 'mt-4'}>
        <Button type="submit" size={isModal ? 'md' : 'lg'}>
          {isModal ? 'Apply filters' : 'Search stays'}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return form;
  }

  return (
    <Card padding="sm" className="shadow-sm sm:p-5">
      {form}
    </Card>
  );
}
