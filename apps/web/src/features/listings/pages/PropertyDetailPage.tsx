import { Badge, Button, Card, PageHeader, Skeleton } from '@housing-platform/ui';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BookingPanel } from '@/features/booking/components/BookingPanel';
import { buildAiSearchParams } from '@/features/search/lib/search-params';
import { NaverPropertyMap } from '@/features/search/components/NaverPropertyMap';
import { usePropertyDetail } from '@/features/search/hooks/usePropertyDetail';
import { useFormatPrice } from '@/i18n/CurrencyProvider';
import { usePropertyTypeLabel } from '@/i18n/hooks';

export function PropertyDetailPage() {
  const { t } = useTranslation('account');
  const { t: tBooking } = useTranslation('booking');
  const formatPrice = useFormatPrice();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);
  const propertyTypeLabel = usePropertyTypeLabel(property?.propertyType ?? 'studio');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="aspect-[16/7] w-full rounded-xl" variant="block" />
        <Skeleton variant="title" className="w-2/3" />
        <Skeleton className="w-1/2" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg px-4 py-16">
        <Card padding="lg" className="w-full text-center">
          <PageHeader
            title={t('listing.notFoundTitle')}
            description={t('listing.notFoundDescription')}
          />
          <Link to="/map" className="mt-6 inline-flex">
            <Button>{t('listing.browseStays')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const coverImage = property.images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {property.images.length > 0 ? (
              property.images.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.altText ?? property.title}
                  className={`border-surface-subtle aspect-[4/3] w-full rounded-xl border object-cover ${
                    image.isCover ? 'sm:col-span-2 sm:aspect-[16/7]' : ''
                  }`}
                />
              ))
            ) : (
              <div className="border-surface-subtle bg-surface-muted text-ink-muted sm:col-span-2 flex aspect-[16/7] items-center justify-center rounded-xl border text-sm">
                {t('listing.photosComingSoon')}
              </div>
            )}
          </div>

          <div className="mt-8">
            <Badge variant="eyebrow">{propertyTypeLabel}</Badge>
            <h1 className="text-ink mt-2 text-3xl font-bold tracking-tight">{property.title}</h1>
            <p className="text-ink-muted mt-2 text-sm">
              {property.district}
              {property.nearestStationName ? ` · ${property.nearestStationName}` : ''}
              {property.nearestStationWalkMin
                ? ` · ${t('listing.minWalk', { minutes: property.nearestStationWalkMin })}`
                : ''}
            </p>
            <div className="mt-4">
              <Link
                to={{
                  pathname: '/map',
                  search: buildAiSearchParams({
                    aiQuery: 'similar but cheaper',
                    referencePropertyId: property.id,
                  }).toString(),
                }}
              >
                <Button type="button" variant="secondary" size="sm">
                  {t('listing.findSimilar')}
                </Button>
              </Link>
            </div>
            <p className="text-ink mt-4 leading-relaxed">{property.description}</p>
          </div>

          <section className="mt-10">
            <h2 className="text-ink text-xl font-semibold">{t('listing.rooms')}</h2>
            <div className="mt-4 space-y-3">
              {property.rooms.map((room) => (
                <article
                  key={room.id}
                  className="border-surface-subtle flex flex-col gap-2 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-ink font-semibold">{room.name}</h3>
                    <p className="text-ink-muted text-sm">
                      {room.maxOccupancy}{' '}
                      {room.maxOccupancy === 1 ? t('listing.guest') : t('listing.guests')}
                      {room.sizeSqm ? ` · ${room.sizeSqm} m²` : ''}
                    </p>
                  </div>
                  <p className="text-ink font-semibold">
                    {formatPrice(room.monthlyPriceKrw)}
                    <span className="text-ink-muted text-sm font-normal">{tBooking('perMonth')}</span>
                  </p>
                </article>
              ))}
            </div>
          </section>

          {property.amenities.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-ink text-xl font-semibold">{t('listing.amenities')}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <Badge key={amenity.id} variant="outline">
                    {amenity.name}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {property.latitude != null && property.longitude != null ? (
            <section className="mt-10">
              <h2 className="text-ink text-xl font-semibold">{t('listing.location')}</h2>
              <p className="text-ink-muted mt-2 text-sm">
                {property.addressLine1}
                {property.addressLine2 ? `, ${property.addressLine2}` : ''}, {property.city}
              </p>
              <div className="mt-4 h-72 overflow-hidden rounded-xl">
                <NaverPropertyMap
                  properties={[
                    {
                      id: property.id,
                      title: property.title,
                      slug: property.slug,
                      propertyType: property.propertyType,
                      district: property.district,
                      nearestStationName: property.nearestStationName,
                      monthlyPriceMin: property.monthlyPriceMin,
                      coverImageUrl: coverImage?.url ?? null,
                      coverImageAlt: coverImage?.altText ?? null,
                      tags: property.tags,
                      latitude: property.latitude,
                      longitude: property.longitude,
                      distanceMeters: null,
                    },
                  ]}
                  centerLat={property.latitude}
                  centerLng={property.longitude}
                  selectedPropertyId={property.id}
                  markerVariant="pin"
                />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel property={property} />
        </aside>
      </div>
    </div>
  );
}
