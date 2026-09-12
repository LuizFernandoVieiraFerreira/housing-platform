import { ArrowRight, Play, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { professionalPlatforms, type ProfessionalPlatformKey } from '@/features/platforms';
import { PageContainer } from '@/shared/components/PageContainer';
import {
  responsiveIcon,
  responsiveIconContainer,
  roleLink,
  rolesColumn,
} from '@/shared/lib/variants';

type HomeRoleKey = 'guest' | ProfessionalPlatformKey;

interface RoleConfig {
  key: HomeRoleKey;
  icon: LucideIcon;
  to: string;
}

// The band is what routes visitors to their platform, so every role links somewhere.
const roleConfigs: RoleConfig[] = [
  { key: 'guest', icon: UserRound, to: '/map' },
  ...professionalPlatforms.map(({ key, icon, landingPath }) => ({ key, icon, to: landingPath })),
];

interface HomeRoleLinkProps {
  icon: LucideIcon;
  to: string;
  name: string;
  description: string;
  cta: string;
}

function HomeRoleLink({ icon: Icon, to, name, description, cta }: HomeRoleLinkProps) {
  return (
    /*
     * Layout progression matching the original Alura-inspired design:
     * - Mobile (<400px): stacked, text centered, icon above
     * - 400px+: horizontal flex, icon beside text, text left-aligned
     * - 510px+: icon gets circular border and grows to 80×80
     * - 1000px+: handled by parent (two-column layout)
     */
    <Link to={to} className={roleLink()}>
      {/*
       * Icon container: 36×36 at mobile, 80×80 with circular border from 510px.
       * The SVG fills the container on mobile but stays 40×40 once the container
       * grows, centering it inside the circle.
       */}
      <span className={responsiveIconContainer()}>
        <Icon aria-hidden="true" className={responsiveIcon()} />
      </span>
      <div>
        <h3 className="mb-2.5 text-lg font-bold min-[1000px]:text-[21px]">{name}</h3>
        <p className="text-base opacity-80 min-[1000px]:pr-5">{description}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-[3px]">
          {cta}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-[3px]"
          />
        </span>
      </div>
    </Link>
  );
}

export function HomeRolesSection() {
  const { t } = useTranslation('home');

  return (
    <section className="bg-marketing-roles px-4 pt-9 text-center text-white sm:px-6 min-[1000px]:px-20 min-[1000px]:pb-[60px] min-[1000px]:pt-[85px]">
      <PageContainer className="min-[1000px]:flex min-[1000px]:justify-between">
        {/* Video column */}
        <div className={rolesColumn({ side: 'video' })}>
          <h2 className="pb-5 text-xl font-bold min-[900px]:text-[1.4em] min-[900px]:leading-[1.3]">
            {t('roles.title')}
          </h2>
          <div className="mx-auto max-w-[480px] min-[1000px]:mx-0">
            {/* aspect-video holds the 16:9 ratio natively */}
            <div className="flex aspect-video flex-col items-center justify-center gap-2 border-[3px] border-white/40 bg-black/[0.12] text-sm">
              <Play aria-hidden="true" className="h-10 w-10" />
              <span>{t('roles.videoPlaceholder')}</span>
            </div>
          </div>
        </div>

        {/* Roles list column */}
        <div className={rolesColumn({ side: 'links' })}>
          {roleConfigs.map(({ key, icon, to }) => (
            <HomeRoleLink
              key={key}
              icon={icon}
              to={to}
              name={t(`roles.items.${key}.name`)}
              description={t(`roles.items.${key}.description`)}
              cta={t(`roles.items.${key}.cta`)}
            />
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
