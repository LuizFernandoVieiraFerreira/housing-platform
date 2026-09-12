import type { AccommodationType } from '@housing-platform/types';
import { Users, DoorOpen, Minimize2, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@housing-platform/utils';

import { AccommodationTypeCard } from '@/features/home/components/AccommodationTypeCard';
import { HomeAnimatedBackground } from '@/features/home/components/HomeAnimatedBackground';
import { HomeHeroHeadline } from '@/features/home/components/HomeHeroHeadline';
import { HomeRolesSection } from '@/features/home/components/HomeRolesSection';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { PageContainer } from '@/shared/components/PageContainer';
import { marketingHero } from '@/shared/lib/variants';

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
      <section className={cn(marketingHero({ background: 'skyline' }), 'relative py-10')}>
        <HomeAnimatedBackground />

        <PageContainer className="relative z-10 flex flex-1 flex-col gap-10">
          <div className="text-center">
            <HomeHeroHeadline />
            <p className="text-ink-muted mx-auto max-w-[34ch] text-lg font-light leading-[1.3] sm:text-xl lg:text-[1.625rem]">
              {t('heroSubtitle')}
            </p>
          </div>

          <HomeSearchBar />

          {/*
           * Two-up on phones, four across from `xl`. The gap does the spacing work that
           * an `nth-child` margin rule used to, which is why the flex/grid swap is safe.
           */}
          <div className="mt-auto grid translate-y-8 grid-cols-2 pb-5 sm:gap-3.5 xl:flex xl:flex-nowrap xl:justify-center">
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
