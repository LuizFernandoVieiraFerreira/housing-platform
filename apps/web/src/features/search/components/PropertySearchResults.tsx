import type { SearchPropertyCard } from '@housing-platform/types';
import { EmptyState } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { LocalizedPropertyCard } from '@/shared/components/LocalizedPropertyCard';

interface PropertySearchResultsProps {
  items: SearchPropertyCard[];
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  onHoverProperty?: (propertyId: string | null) => void;
  registerItemRef?: (propertyId: string, element: HTMLDivElement | null) => void;
  variant?: 'grid' | 'list' | 'map-grid';
}

function toCardVariant(variant: 'grid' | 'list' | 'map-grid') {
  if (variant === 'map-grid') {
    return 'compact' as const;
  }

  if (variant === 'list') {
    return 'horizontal' as const;
  }

  return 'default' as const;
}

function getSelectionClassName(variant: 'grid' | 'list' | 'map-grid', isSelected: boolean) {
  if (!isSelected) {
    return variant === 'list' ? 'bg-white' : undefined;
  }

  if (variant === 'list') {
    return 'bg-brand-50/60 ring-brand-400 ring-inset';
  }

  if (variant === 'map-grid') {
    return 'outline-brand-400 outline outline-2 -outline-offset-2 rounded-xl';
  }

  return 'ring-brand-400 rounded-xl ring-2';
}

function getLinkClassName(variant: 'grid' | 'list' | 'map-grid') {
  if (variant === 'list') {
    return 'hover:bg-surface-muted/60 flex gap-3 px-4 py-3 transition-colors';
  }

  return 'block';
}

function getListContainerClassName(variant: 'grid' | 'list' | 'map-grid') {
  if (variant === 'map-grid') {
    return 'grid grid-cols-2 gap-3 p-4';
  }

  if (variant === 'list') {
    return 'divide-surface-subtle divide-y';
  }

  return 'space-y-4';
}

export function PropertySearchResults({
  items,
  selectedPropertyId,
  hoveredPropertyId,
  onHoverProperty,
  registerItemRef,
  variant = 'grid',
}: PropertySearchResultsProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        className="mx-4 my-10"
        description="No stays match your filters. Try widening your dates, price range, or map area."
      />
    );
  }

  const cardVariant = toCardVariant(variant);
  const isMapGrid = variant === 'map-grid';

  return (
    <div className={getListContainerClassName(variant)}>
      {items.map((property) => {
        const isSelected = selectedPropertyId === property.id;

        return (
          <div
            key={property.id}
            ref={(element) => registerItemRef?.(property.id, element)}
            className={getSelectionClassName(variant, isSelected)}
            onMouseEnter={isMapGrid ? () => onHoverProperty?.(property.id) : undefined}
            onMouseLeave={
              isMapGrid
                ? () => {
                    if (hoveredPropertyId === property.id) {
                      onHoverProperty?.(null);
                    }
                  }
                : undefined
            }
          >
            <Link to={`/listings/${property.id}`} className={getLinkClassName(variant)}>
              <LocalizedPropertyCard
                variant={cardVariant}
                title={property.title}
                propertyType={property.propertyType}
                district={property.district}
                nearestStationName={property.nearestStationName}
                monthlyPriceMin={property.monthlyPriceMin}
                coverImageUrl={property.coverImageUrl}
                coverImageAlt={property.coverImageAlt}
              />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
