import { Users, DoorOpen, Minimize2, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccommodationTypeCard } from '@/features/home/components/AccommodationTypeCard';
import { HomeAnimatedBackground } from '@/features/home/components/HomeAnimatedBackground';
import { HomeHeroHeadline } from '@/features/home/components/HomeHeroHeadline';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { FeaturedPropertiesSection } from '@/features/listings/components/FeaturedPropertiesSection';
import { PageContainer } from '@/shared/components/PageContainer';

interface AccommodationTypeConfig {
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  slug: string;
}

const accommodationTypeConfigs: AccommodationTypeConfig[] = [
  {
    titleKey: 'home.accommodationTypes.share-house.title',
    descriptionKey: 'home.accommodationTypes.share-house.description',
    icon: Users,
    slug: 'share-house',
  },
  {
    titleKey: 'home.accommodationTypes.studio.title',
    descriptionKey: 'home.accommodationTypes.studio.description',
    icon: DoorOpen,
    slug: 'studio',
  },
  {
    titleKey: 'home.accommodationTypes.micro-studio.title',
    descriptionKey: 'home.accommodationTypes.micro-studio.description',
    icon: Minimize2,
    slug: 'micro-studio',
  },
  {
    titleKey: 'home.accommodationTypes.multi-bedroom.title',
    descriptionKey: 'home.accommodationTypes.multi-bedroom.description',
    icon: LayoutGrid,
    slug: 'multi-bedroom',
  },
];

export function HomePage() {
  const { t } = useTranslation('search');

  return (
    <div>
      <section className="home-background bg-surface-page px-4 py-10 sm:px-6 lg:px-20">
        <HomeAnimatedBackground />

        <PageContainer className="relative z-[3] flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="text-brown-500 text-sm font-bold uppercase tracking-wide">
              {t('home.welcome')}
            </p>
            <HomeHeroHeadline />
          </div>

          <HomeSearchBar />

          <div className="flex flex-col gap-4">
            <h2 className="text-ink text-xl font-bold">{t('home.accommodationType')}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
              {accommodationTypeConfigs.map((type) => (
                <AccommodationTypeCard
                  key={type.slug}
                  title={t(type.titleKey)}
                  description={t(type.descriptionKey)}
                  icon={type.icon}
                  slug={type.slug}
                />
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <FeaturedPropertiesSection />
    </div>
  );
}
