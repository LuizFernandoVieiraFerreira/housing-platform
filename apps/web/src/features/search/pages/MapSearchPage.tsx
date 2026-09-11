import type { AccommodationType, PropertySearchFilters } from '@housing-platform/types';
import { Button, EmptyState, PropertyCardSkeleton } from '@housing-platform/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AiSearchBar } from '@/features/search/components/AiSearchBar';
import { InterpretedFiltersChips } from '@/features/search/components/InterpretedFiltersChips';
import { MapSearchToolbar } from '@/features/search/components/MapSearchToolbar';
import { MapSelectedPropertyPreview } from '@/features/search/components/MapSelectedPropertyPreview';
import { NaverPropertyMap } from '@/features/search/components/NaverPropertyMap';
import { PropertySearchFilterModal } from '@/features/search/components/PropertySearchFilterModal';
import { PropertySearchResults } from '@/features/search/components/PropertySearchResults';
import { useAiPropertySearch } from '@/features/search/hooks/useAiPropertySearch';
import { usePropertySearch } from '@/features/search/hooks/usePropertySearch';
import {
  buildAiSearchParams,
  buildSearchParams,
  parseAiSearchParams,
  parseSearchParams,
  SEOUL_CENTER,
} from '@/features/search/lib/search-params';
import { getMapSearchSkeletonCount } from '@/features/search/lib/search-config';
import type { NaverPixelOffset } from '@/shared/lib/naver-maps';

export function MapSearchPage() {
  const { t } = useTranslation('search');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const { aiQuery, referencePropertyId } = useMemo(
    () => parseAiSearchParams(searchParams),
    [searchParams],
  );
  const useAiSearch = Boolean(aiQuery || referencePropertyId);

  const aiRequest = useMemo(
    () =>
      useAiSearch
        ? {
            query: aiQuery || undefined,
            referencePropertyId,
            context: {
              checkIn: filters.checkIn,
              checkOut: filters.checkOut,
              guests: filters.guests,
              mapCenterLat: filters.centerLat,
              mapCenterLng: filters.centerLng,
            },
          }
        : null,
    [
      useAiSearch,
      aiQuery,
      referencePropertyId,
      filters.checkIn,
      filters.checkOut,
      filters.guests,
      filters.centerLat,
      filters.centerLng,
    ],
  );

  const classicSearch = usePropertySearch(filters);
  const aiSearch = useAiPropertySearch(aiRequest);

  const data = useAiSearch
    ? {
        items: aiSearch.data?.items ?? [],
        totalCount: aiSearch.data?.totalCount ?? 0,
      }
    : classicSearch.data;
  const isLoading = useAiSearch ? aiSearch.isLoading : classicSearch.isLoading;
  const isError = useAiSearch ? aiSearch.isError : classicSearch.isError;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedMarkerPosition, setSelectedMarkerPosition] = useState<NaverPixelOffset | null>(
    null,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  const selectedProperty = useMemo(
    () => data?.items.find((property) => property.id === selectedPropertyId) ?? null,
    [data?.items, selectedPropertyId],
  );

  const registerItemRef = useCallback((propertyId: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(propertyId, element);
      return;
    }

    itemRefs.current.delete(propertyId);
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) {
      setSelectedMarkerPosition(null);
      return;
    }

    itemRefs.current.get(selectedPropertyId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [selectedPropertyId, data?.items]);

  useEffect(() => {
    if (selectedPropertyId && !selectedProperty) {
      setSelectedPropertyId(null);
    }
  }, [selectedProperty, selectedPropertyId]);

  const handleMarkerClick = useCallback((propertyId: string) => {
    setSelectedPropertyId((current) => (current === propertyId ? null : propertyId));
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedPropertyId(null);
  }, []);

  const handleSelectedMarkerPosition = useCallback((position: NaverPixelOffset | null) => {
    setSelectedMarkerPosition((current) => {
      if (!position) {
        return null;
      }

      if (current?.x === position.x && current?.y === position.y) {
        return current;
      }

      return position;
    });
  }, []);

  const updateFilters = (nextFilters: PropertySearchFilters) => {
    const params = buildSearchParams({
      ...SEOUL_CENTER,
      ...nextFilters,
    });
    navigate({ pathname: '/map', search: params.toString() }, { replace: true });
  };

  const handleAiSearch = (query: string) => {
    const params = buildAiSearchParams({
      aiQuery: query,
      referencePropertyId,
      filters: {
        ...SEOUL_CENTER,
        ...filters,
      },
    });
    navigate({ pathname: '/map', search: params.toString() });
  };

  const handlePropertyTypeChange = (propertyType: AccommodationType | '') => {
    updateFilters({
      ...filters,
      propertyType: propertyType || undefined,
    });
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-2">
        <aside
          className={[
            'border-surface-subtle flex min-h-0 flex-col border-r bg-white',
            mobileListOpen ? 'fixed inset-x-0 bottom-16 top-16 z-20 flex md:bottom-0' : 'hidden',
            'lg:static lg:z-auto lg:flex',
          ].join(' ')}
          aria-label={t('map.searchResults')}
        >
          <AiSearchBar initialQuery={aiQuery} isLoading={isLoading} onSearch={handleAiSearch} />

          {useAiSearch ? (
            <InterpretedFiltersChips
              filters={aiSearch.data?.interpretedFilters ?? filters}
              explanation={aiSearch.data?.explanation}
              fallbackUsed={aiSearch.data?.fallbackUsed}
            />
          ) : null}

          <MapSearchToolbar
            filters={filters}
            totalCount={data?.totalCount ?? 0}
            isLoading={isLoading}
            onOpenFilters={() => setFiltersOpen(true)}
            onPropertyTypeChange={handlePropertyTypeChange}
          />

          {isError ? (
            <EmptyState variant="error" className="mx-4 mt-4" description={t('map.loadError')} />
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {Array.from({ length: getMapSearchSkeletonCount() }).map((_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <PropertySearchResults
                items={data?.items ?? []}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onHoverProperty={setHoveredPropertyId}
                registerItemRef={registerItemRef}
                variant="map-grid"
              />
            )}
          </div>
        </aside>

        <section
          aria-label={t('map.map')}
          className={[
            'relative min-h-0 min-w-0 flex-1',
            mobileListOpen ? 'hidden lg:block' : 'block',
          ].join(' ')}
        >
          <NaverPropertyMap
            properties={data?.items ?? []}
            centerLat={filters.centerLat ?? SEOUL_CENTER.centerLat}
            centerLng={filters.centerLng ?? SEOUL_CENTER.centerLng}
            selectedPropertyId={selectedPropertyId}
            hoveredPropertyId={hoveredPropertyId}
            onSelectProperty={handleMarkerClick}
            onMapClick={handleMapClick}
            onSelectedMarkerPosition={handleSelectedMarkerPosition}
            fullBleed
          />

          {selectedProperty && selectedMarkerPosition ? (
            <MapSelectedPropertyPreview
              property={selectedProperty}
              position={selectedMarkerPosition}
              onClose={handleMapClick}
            />
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center md:bottom-4 lg:hidden">
            <Button
              type="button"
              size="sm"
              className="pointer-events-auto shadow-lg"
              onClick={() => setMobileListOpen((open) => !open)}
            >
              {mobileListOpen ? t('map.viewMap') : t('map.viewList')}
            </Button>
          </div>
        </section>
      </div>

      <PropertySearchFilterModal
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onSubmit={updateFilters}
      />
    </>
  );
}
