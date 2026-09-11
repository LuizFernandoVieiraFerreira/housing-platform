import { Badge, Button } from '@housing-platform/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  getProfessionalPlatform,
  isPlatformOpen,
  type ProfessionalPlatformKey,
} from '@/features/platforms/lib/professional-platforms';
import { PageContainer } from '@/shared/components/PageContainer';

const stepKeys = ['first', 'second', 'third', 'fourth'] as const;

interface ProfessionalPlatformPageProps {
  platform: ProfessionalPlatformKey;
}

export function ProfessionalPlatformPage({ platform }: ProfessionalPlatformPageProps) {
  const { t } = useTranslation('platforms');
  const config = getProfessionalPlatform(platform);
  const { icon: Icon } = config;

  return (
    <div>
      {/* Hero section — same height as the home page hero for visual consistency. */}
      <section className="platform-hero bg-brand-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-20">
        <PageContainer className="max-w-2xl text-center">
          <span className="text-brand-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Icon size={28} aria-hidden />
          </span>
          <Badge variant="eyebrow">{t(`${platform}.tagline`)}</Badge>
          <h1 className="text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t(`${platform}.title`)}
          </h1>
          <p className="text-ink-muted mt-4 text-lg">{t(`${platform}.subtitle`)}</p>

          {isPlatformOpen(config) ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to={config.signupPath}>{t('cta.getStarted')}</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link to={config.loginPath}>{t('cta.logIn')}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8">
              <Badge variant="outline">{t('cta.comingSoon')}</Badge>
              <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm">
                {t(`${platform}.comingSoonNote`)}
              </p>
            </div>
          )}
        </PageContainer>
      </section>

      {/* Steps section — stepper explaining the registration process. */}
      <section className="platform-steps px-4 py-16 sm:px-6 lg:px-20">
        <PageContainer className="max-w-3xl">
          <h2 className="platform-steps-title text-center">{t(`${platform}.steps.title`)}</h2>

          <div className="platform-stepper">
            {stepKeys.map((step, index) => (
              <div key={step} className="platform-step">
                <span className="platform-step-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="platform-step-content">
                  <h3 className="platform-step-title">{t(`${platform}.steps.${step}.title`)}</h3>
                  <p className="platform-step-description">
                    {t(`${platform}.steps.${step}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
