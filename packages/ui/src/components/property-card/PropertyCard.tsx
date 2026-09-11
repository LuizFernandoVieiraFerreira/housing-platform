import type { AccommodationType } from '@housing-platform/types';

import { cn } from '@housing-platform/utils';
import { Badge } from '../badge/Badge';
import { formatMonthlyPrice, propertyTypeLabels } from './property-card.utils';

export type PropertyCardVariant = 'default' | 'compact' | 'horizontal';

export interface PropertyCardProps {
  title: string;
  propertyType: AccommodationType;
  district: string;
  nearestStationName?: string | null;
  monthlyPriceMin: number;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  tags?: string[];
  variant?: PropertyCardVariant;
  className?: string;
  propertyTypeLabel?: string;
  monthlyPriceFormatted?: string;
  photoPlaceholderCompact?: string;
  photoPlaceholderDefault?: string;
  priceSuffix?: string;
}

function PropertyCardImage({
  coverImageUrl,
  imageAlt,
  variant,
  photoPlaceholderCompact,
  photoPlaceholderDefault,
}: {
  coverImageUrl?: string | null;
  imageAlt: string;
  variant: PropertyCardVariant;
  photoPlaceholderCompact?: string;
  photoPlaceholderDefault?: string;
}) {
  const isHorizontal = variant === 'horizontal';
  const isCompact = variant === 'compact';
  const compactPlaceholder = photoPlaceholderCompact ?? 'Photo soon';
  const defaultPlaceholder = photoPlaceholderDefault ?? 'Photo coming soon';

  return (
    <div
      className={cn(
        'bg-surface-muted overflow-hidden',
        isHorizontal ? 'h-24 w-28 shrink-0 rounded-lg' : 'aspect-[4/3]',
      )}
    >
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={imageAlt}
          className={cn(
            'h-full w-full object-cover',
            !isHorizontal &&
              'transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none',
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'from-brand-100 to-surface-muted flex h-full items-center justify-center bg-gradient-to-br text-center',
            isCompact ? 'px-3' : isHorizontal ? 'px-2' : 'px-6',
          )}
        >
          <p className={cn('text-ink-muted', isCompact || isHorizontal ? 'text-xs' : 'text-sm')}>
            {isCompact || isHorizontal ? compactPlaceholder : defaultPlaceholder}
          </p>
        </div>
      )}
    </div>
  );
}

function PropertyCardContent({
  title,
  propertyType,
  district,
  nearestStationName,
  monthlyPriceMin,
  tags,
  variant,
  propertyTypeLabel,
  monthlyPriceFormatted,
  priceSuffix = '+/30 days',
}: Omit<
  PropertyCardProps,
  | 'coverImageUrl'
  | 'coverImageAlt'
  | 'className'
  | 'photoPlaceholderCompact'
  | 'photoPlaceholderDefault'
>) {
  const isHorizontal = variant === 'horizontal';
  const isCompact = variant === 'compact';
  const typeLabel = propertyTypeLabel ?? propertyTypeLabels[propertyType];
  const priceLabel = monthlyPriceFormatted ?? formatMonthlyPrice(monthlyPriceMin);

  const location = (
    <>
      {district}
      {nearestStationName ? ` · ${nearestStationName}` : ''}
    </>
  );

  return (
    <div
      className={cn(
        isHorizontal ? 'min-w-0 flex-1' : isCompact ? 'space-y-1.5 p-3' : 'space-y-3 p-4',
      )}
    >
      <Badge variant="eyebrow" className={isCompact ? 'text-[10px]' : undefined}>
        {typeLabel}
      </Badge>

      <h3
        className={cn(
          'text-ink font-semibold leading-snug',
          isHorizontal
            ? 'mt-1 line-clamp-2 text-sm'
            : isCompact
              ? 'line-clamp-2 text-sm'
              : 'text-lg',
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-ink-muted',
          isHorizontal ? 'mt-1 truncate text-xs' : isCompact ? 'line-clamp-1 text-xs' : 'text-sm',
        )}
      >
        {location}
      </p>

      <p
        className={cn(
          'text-ink font-semibold',
          isHorizontal ? 'mt-2 text-sm' : isCompact ? 'pt-0.5 text-sm' : 'text-base',
        )}
      >
        {priceLabel}
        <span
          className={cn(
            'text-ink-muted font-normal',
            isHorizontal || isCompact ? 'text-xs' : 'text-sm',
          )}
        >
          {priceSuffix}
        </span>
      </p>

      {!isHorizontal && !isCompact && tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="brand">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PropertyCard({
  title,
  propertyType,
  district,
  nearestStationName,
  monthlyPriceMin,
  coverImageUrl,
  coverImageAlt,
  tags = [],
  variant = 'default',
  className,
  propertyTypeLabel,
  monthlyPriceFormatted,
  photoPlaceholderCompact,
  photoPlaceholderDefault,
  priceSuffix,
}: PropertyCardProps) {
  const imageAlt = coverImageAlt ?? title;

  if (variant === 'horizontal') {
    return (
      <>
        <PropertyCardImage
          coverImageUrl={coverImageUrl}
          imageAlt={imageAlt}
          variant={variant}
          photoPlaceholderCompact={photoPlaceholderCompact}
          photoPlaceholderDefault={photoPlaceholderDefault}
        />
        <PropertyCardContent
          title={title}
          propertyType={propertyType}
          district={district}
          nearestStationName={nearestStationName}
          monthlyPriceMin={monthlyPriceMin}
          tags={tags}
          variant={variant}
          propertyTypeLabel={propertyTypeLabel}
          monthlyPriceFormatted={monthlyPriceFormatted}
          priceSuffix={priceSuffix}
        />
      </>
    );
  }

  return (
    <article
      className={cn(
        'border-surface-subtle hover:shadow-card group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow motion-reduce:transition-none',
        className,
      )}
    >
      <PropertyCardImage
        coverImageUrl={coverImageUrl}
        imageAlt={imageAlt}
        variant={variant}
        photoPlaceholderCompact={photoPlaceholderCompact}
        photoPlaceholderDefault={photoPlaceholderDefault}
      />
      <PropertyCardContent
        title={title}
        propertyType={propertyType}
        district={district}
        nearestStationName={nearestStationName}
        monthlyPriceMin={monthlyPriceMin}
        tags={tags}
        variant={variant}
        propertyTypeLabel={propertyTypeLabel}
        monthlyPriceFormatted={monthlyPriceFormatted}
        priceSuffix={priceSuffix}
      />
    </article>
  );
}
