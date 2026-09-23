/**
 * Cookie/analytics consent banner.
 *
 * Shows on first visit when consent is unknown.
 * Non-intrusive bottom banner with Accept/Decline options.
 */

import { Button } from '@housing-platform/ui';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  shouldShowConsentBanner,
  onConsentChange,
} from '../index';

export function ConsentBanner() {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsVisible(shouldShowConsentBanner());

    // Listen for changes (e.g., if consent is reset)
    const unsubscribe = onConsentChange((state) => {
      setIsVisible(state === 'unknown');
    });

    return unsubscribe;
  }, []);

  if (!isVisible) {
    return null;
  }

  const handleAccept = () => {
    grantAnalyticsConsent();
    setIsVisible(false);
  };

  const handleDecline = () => {
    denyAnalyticsConsent();
    setIsVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t('consent.title', 'Cookie preferences')}
      className="bg-surface border-surface-subtle fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6"
    >
      <div className="mb-3 sm:mb-0">
        <p className="text-ink text-sm font-medium">
          {t('consent.title', 'We use cookies to improve your experience')}
        </p>
        <p className="text-ink-muted mt-1 text-sm">
          {t(
            'consent.description',
            'We use analytics cookies to understand how you use our site and improve it.',
          )}{' '}
          <Link to="/privacy" className="text-brand-600 hover:underline">
            {t('consent.learnMore', 'Learn more')}
          </Link>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={handleDecline}>
          {t('consent.decline', 'Decline')}
        </Button>
        <Button size="sm" onClick={handleAccept}>
          {t('consent.accept', 'Accept')}
        </Button>
      </div>
    </div>
  );
}
