import { ArrowRight, Play, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { professionalPlatforms } from '@/features/platforms/lib/professional-platforms';
import { PageContainer } from '@/shared/components/PageContainer';

interface RoleConfig {
  key: string;
  icon: LucideIcon;
  to: string;
}

// The band is what routes visitors to their platform, so every role links somewhere.
const roleConfigs: RoleConfig[] = [
  { key: 'guest', icon: UserRound, to: '/map' },
  ...professionalPlatforms.map(({ key, icon, landingPath }) => ({ key, icon, to: landingPath })),
];

interface HomeRolesSectionProps {
  /** Embed URL for the product tour. A placeholder panel shows until one is set. */
  videoUrl?: string;
}

export function HomeRolesSection({ videoUrl }: HomeRolesSectionProps) {
  const { t } = useTranslation('search');

  return (
    <section className="home-roles px-4 sm:px-6 lg:px-20">
      <PageContainer className="home-roles-inner">
        <div className="home-roles-video">
          <h2 className="home-roles-title">{t('home.roles.title')}</h2>
          <div className="home-roles-video-wrapper">
            <div className="elastic-media-container">
              {videoUrl ? (
                <iframe
                  className="elastic-media"
                  src={videoUrl}
                  title={t('home.roles.videoTitle')}
                  allowFullScreen
                />
              ) : (
                <div className="elastic-media home-roles-video-placeholder">
                  <Play aria-hidden="true" />
                  <span>{t('home.roles.videoPlaceholder')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="home-roles-list">
          {roleConfigs.map(({ key, icon: Icon, to }) => (
            <Link key={key} to={to} className="home-roles-item">
              <span className="home-roles-item-icon">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3 className="home-roles-item-name">{t(`home.roles.items.${key}.name`)}</h3>
                <p className="home-roles-item-description">
                  {t(`home.roles.items.${key}.description`)}
                </p>
                <span className="home-roles-item-cta">
                  {t(`home.roles.items.${key}.cta`)}
                  <ArrowRight aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
