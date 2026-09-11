import { PageHeader } from '@housing-platform/ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PageContainer } from '@/shared/components/PageContainer';

export type LegalDocument = 'terms' | 'privacy' | 'refund';

interface LegalPageProps {
  page: LegalDocument;
}

export function LegalPage({ page }: LegalPageProps) {
  const { t } = useTranslation('common');
  const title = t(`legal.${page}.title`);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Housing Platform`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <PageContainer className="px-4 py-10 sm:px-6">
      <PageHeader title={title} description={t(`legal.${page}.summary`)} />

      <div className="text-ink-muted mt-8 max-w-3xl space-y-4 text-sm leading-relaxed">
        <p>{t(`legal.${page}.placeholder`)}</p>
        <p>
          {t('legal.contactPrefix')}{' '}
          <a href="mailto:support@housing-platform.dev" className="text-brand-600 hover:underline">
            support@housing-platform.dev
          </a>
        </p>
        <Link to="/" className="text-brand-600 inline-block hover:underline">
          {t('legal.backToHome')}
        </Link>
      </div>
    </PageContainer>
  );
}
