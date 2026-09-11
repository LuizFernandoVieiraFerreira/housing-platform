import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

const audienceKeys = [
  'home.audiences.internationalStudents',
  'home.audiences.businessStay',
  'home.audiences.monthlyTravelers',
] as const;

const ROTATION_INTERVAL_MS = 2000;

export function HomeHeroHeadline() {
  const { t } = useTranslation('search');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLabelIndex((current) => (current + 1) % audienceKeys.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [prefersReducedMotion]);

  return (
    <h1 className="home-headline-title text-ink">
      {t('home.heroPrefix')}{' '}
      {/*
       * The rotation is decoration: an <h1> whose accessible name changes every two
       * seconds is unusable with a screen reader and gives crawlers nothing stable.
       * Assistive tech and crawlers read every audience once; sighted users see the
       * cycle. Announcing each change via aria-live would be worse, not better.
       */}
      <span className="sr-only">{audienceKeys.map((key) => t(key)).join(', ')}</span>
      <span
        key={labelIndex}
        aria-hidden="true"
        className="text-brand-500 animate-hero-label-fade-in inline-block motion-reduce:animate-none"
      >
        {t(audienceKeys[labelIndex]!)}
      </span>
    </h1>
  );
}
