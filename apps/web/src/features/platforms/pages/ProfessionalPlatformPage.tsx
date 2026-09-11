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
      <section className="min-h-marketing-hero bg-brand-50 md:min-h-marketing-hero-md xl:min-h-marketing-hero-xl 2xl:min-h-marketing-hero-2xl flex flex-col items-center justify-center px-4 sm:px-6 lg:px-20">
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
              {platform === 'photographer' || platform === 'agent' ? (
                <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm">
                  {t(`${platform}.comingSoonNote`)}
                </p>
              ) : null}
            </div>
          )}
        </PageContainer>
      </section>

      <section className="bg-marketing-steps px-4 py-16 text-white sm:px-6 lg:px-20">
        <PageContainer className="max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-white md:text-[1.75rem]">
            {t(`${platform}.steps.title`)}
          </h2>

          <div className="flex flex-col gap-6">
            {stepKeys.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-5 rounded-xl border border-white/10 bg-white/[0.08] p-5 sm:px-7 sm:py-6"
              >
                <span className="text-brand-600 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold sm:h-[52px] sm:w-[52px] sm:text-base">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white sm:text-lg">
                    {t(`${platform}.steps.${step}.title`)}
                  </h3>
                  <p className="text-sm leading-normal text-white/85">
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
