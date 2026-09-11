import type { AccommodationType } from '@housing-platform/types';
import { Users, DoorOpen, Minimize2, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccommodationTypeCard } from '@/features/home/components/AccommodationTypeCard';
import { HomeAnimatedBackground } from '@/features/home/components/HomeAnimatedBackground';
import { HomeHeroHeadline } from '@/features/home/components/HomeHeroHeadline';
import { HomeRolesSection } from '@/features/home/components/HomeRolesSection';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { PageContainer } from '@/shared/components/PageContainer';

interface AccommodationTypeConfig {
  titleKey: `accommodationTypes.${AccommodationType}.title`;
  descriptionKey: `accommodationTypes.${AccommodationType}.description`;
  icon: LucideIcon;
  slug: AccommodationType;
}

const accommodationTypeConfigs: AccommodationTypeConfig[] = [
  {
    titleKey: 'accommodationTypes.share-house.title',
    descriptionKey: 'accommodationTypes.share-house.description',
    icon: Users,
    slug: 'share-house',
  },
  {
    titleKey: 'accommodationTypes.studio.title',
    descriptionKey: 'accommodationTypes.studio.description',
    icon: DoorOpen,
    slug: 'studio',
  },
  {
    titleKey: 'accommodationTypes.micro-studio.title',
    descriptionKey: 'accommodationTypes.micro-studio.description',
    icon: Minimize2,
    slug: 'micro-studio',
  },
  {
    titleKey: 'accommodationTypes.multi-bedroom.title',
    descriptionKey: 'accommodationTypes.multi-bedroom.description',
    icon: LayoutGrid,
    slug: 'multi-bedroom',
  },
];

export function HomePage() {
  const { t } = useTranslation('home');

  return (
    <div>
      <section className="home-background bg-surface-page min-h-marketing-hero md:min-h-marketing-hero-md xl:min-h-marketing-hero-xl 2xl:min-h-marketing-hero-2xl flex flex-col px-4 py-10 sm:px-6 lg:px-20">
        <HomeAnimatedBackground />

        <PageContainer className="relative z-[3] flex flex-1 flex-col gap-10">
          <div className="home-headline">
            <HomeHeroHeadline />
            <p className="home-headline-subtitle text-ink-muted">{t('heroSubtitle')}</p>
          </div>

          <HomeSearchBar />

          <div className="home-type-list mt-auto">
            {accommodationTypeConfigs.map((type) => (
              <AccommodationTypeCard
                key={type.slug}
                eyebrow={t('accommodationTypes.eyebrow')}
                title={t(type.titleKey)}
                description={t(type.descriptionKey)}
                icon={type.icon}
                slug={type.slug}
              />
            ))}
          </div>
        </PageContainer>
      </section>

      <HomeRolesSection />
    </div>
  );
}
