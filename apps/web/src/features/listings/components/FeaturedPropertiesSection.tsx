import { EmptyState, PropertyCardSkeleton } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { useFeaturedProperties } from '@/features/listings/hooks/useFeaturedProperties';
import { PageContainer } from '@/shared/components/PageContainer';
import { LocalizedPropertyCard } from '@/shared/components/LocalizedPropertyCard';

export function FeaturedPropertiesSection() {
  const { data, isLoading, isError } = useFeaturedProperties();

  return (
    <section className="bg-white px-4 pb-16 pt-6 sm:px-6 lg:px-20">
      <PageContainer>
        <div className="flex flex-col gap-1">
          <p className="text-ink text-sm font-bold">Editor&apos;s picks</p>
          <h2 className="text-ink text-xl font-bold sm:text-2xl">Featured stays</h2>
        </div>
      </PageContainer>

      <PageContainer className="mt-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <EmptyState
            variant="error"
            description="We could not load featured listings right now. Check that Supabase is running and your local env keys are configured."
          />
        ) : null}

        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState description="Featured listings will appear here once properties are published." />
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((property) => (
              <Link key={property.id} to={`/listings/${property.id}`} className="block">
                <LocalizedPropertyCard
                  title={property.title}
                  propertyType={property.propertyType}
                  district={property.district}
                  nearestStationName={property.nearestStationName}
                  monthlyPriceMin={property.monthlyPriceMin}
                  coverImageUrl={property.coverImageUrl}
                  coverImageAlt={property.coverImageAlt}
                  tags={property.tags}
                />
              </Link>
            ))}
          </div>
        ) : null}
      </PageContainer>
    </section>
  );
}
