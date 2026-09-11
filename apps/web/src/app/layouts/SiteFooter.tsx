import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SiteFooter() {
  const { t } = useTranslation('common');

  return (
    <footer className="border-surface-subtle bg-surface-muted border-t pb-16 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav aria-label="Footer" className="text-ink-muted flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/terms" className="hover:text-ink hover:underline">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className="hover:text-ink hover:underline">
            {t('footer.privacy')}
          </Link>
          <Link to="/refund" className="hover:text-ink hover:underline">
            {t('footer.refund')}
          </Link>
          <Link to="/delete-account" className="hover:text-ink hover:underline">
            {t('footer.deleteAccount')}
          </Link>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            {t('footer.blog')}
          </a>
          <Link to="/universities" className="hover:text-ink hover:underline">
            {t('footer.universities')}
          </Link>
          <Link to="/host/login" className="hover:text-ink hover:underline">
            {t('footer.hostLogin')}
          </Link>
        </nav>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-ink text-sm font-semibold">{t('footer.appTitle')}</p>
            <p className="text-ink-muted mt-1 text-xs">{t('footer.appDescription')}</p>
          </div>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink hover:bg-ink/90 inline-flex w-fit items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {t('footer.getApp')}
          </a>
        </div>

        <hr className="border-surface-subtle my-8" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-ink text-base font-semibold">Housing Platform</p>
            <p className="text-ink-muted mt-1 text-xs">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>

          <div>
            <p className="text-ink text-sm font-semibold">{t('footer.contact')}</p>
            <ul className="text-ink-muted mt-2 space-y-1 text-sm">
              <li>
                <a href="tel:+827080653143" className="hover:text-ink hover:underline">
                  +82-10-1234-5678
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@housing-platform.dev"
                  className="hover:text-ink hover:underline"
                >
                  support@housing-platform.dev
                </a>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-ink text-sm font-semibold">{t('footer.businessInfo')}</p>
            <dl className="text-ink-muted mt-2 space-y-1 text-xs">
              <div>
                <dt className="sr-only">Company</dt>
                <dd>{t('footer.company')}</dd>
              </div>
              <div>
                <dt className="sr-only">CEO</dt>
                <dd>{t('footer.ceo')}</dd>
              </div>
              <div>
                <dt className="sr-only">Address</dt>
                <dd>{t('footer.address')}</dd>
              </div>
              <div>
                <dt className="sr-only">Business Registration Number</dt>
                <dd>{t('footer.brn')}</dd>
              </div>
              <div>
                <dt className="sr-only">Mail-order business number</dt>
                <dd>{t('footer.mailOrder')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </footer>
  );
}
