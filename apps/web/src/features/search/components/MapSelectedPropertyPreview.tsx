import type { SearchPropertyCard } from '@housing-platform/types';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { NaverPixelOffset } from '@/shared/lib/naver-maps';
import { LocalizedPropertyCard } from '@/shared/components/LocalizedPropertyCard';

const CARD_WIDTH_PX = 260;
const CARD_HEIGHT_PX = 300;
const MARKER_GAP_PX = 14;
const VIEWPORT_EDGE_PX = 8;

interface MapSelectedPropertyPreviewProps {
  property: SearchPropertyCard;
  position: NaverPixelOffset;
  onClose: () => void;
}

/**
 * `position` is the selected marker's pixel offset within the map container, so
 * the card sits above the marker where there is room and flips below otherwise.
 * Both axes are clamped to keep the card inside the map on small viewports.
 */
function getCardStyle({ x, y }: NaverPixelOffset) {
  const above = y - MARKER_GAP_PX - CARD_HEIGHT_PX;
  const top = above >= VIEWPORT_EDGE_PX ? above : y + MARKER_GAP_PX;

  return {
    left: `clamp(${VIEWPORT_EDGE_PX}px, ${Math.round(x - CARD_WIDTH_PX / 2)}px, calc(100% - ${CARD_WIDTH_PX + VIEWPORT_EDGE_PX}px))`,
    top: `clamp(${VIEWPORT_EDGE_PX}px, ${Math.round(top)}px, calc(100% - ${CARD_HEIGHT_PX + VIEWPORT_EDGE_PX}px))`,
    width: `${CARD_WIDTH_PX}px`,
  };
}

export function MapSelectedPropertyPreview({
  property,
  position,
  onClose,
}: MapSelectedPropertyPreviewProps) {
  return (
    <div className="absolute z-30" style={getCardStyle(position)}>
      <Link to={`/listings/${property.id}`} className="block" aria-label={`View ${property.title}`}>
        <LocalizedPropertyCard
          variant="compact"
          className="shadow-overlay"
          title={property.title}
          propertyType={property.propertyType}
          district={property.district}
          nearestStationName={property.nearestStationName}
          monthlyPriceMin={property.monthlyPriceMin}
          coverImageUrl={property.coverImageUrl}
          coverImageAlt={property.coverImageAlt}
        />
      </Link>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="text-ink absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
