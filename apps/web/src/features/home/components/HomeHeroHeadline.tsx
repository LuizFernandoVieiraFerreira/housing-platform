import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { animatedLabel, heroHeadline } from '@/shared/lib/variants';

const audienceKeys = [
  'audiences.internationalStudents',
  'audiences.businessStay',
  'audiences.monthlyTravelers',
] as const;

const ROTATION_INTERVAL_MS = 2000;

export function HomeHeroHeadline() {
  const { t } = useTranslation('home');
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
    /*
     * Display sizing steps four times across the scale. Expressed in `rem` rather than
     * the original `em` so the size no longer compounds with whatever the ancestor
     * font-size happens to be. A fluid `clamp()` would collapse these steps into one
     * declaration, but that changes the size at every width and wants design sign-off.
     */
    <h1 className={heroHeadline()}>
      {t('heroPrefix')}{' '}
      {/*
       * The rotation is decoration: an <h1> whose accessible name changes every two
       * seconds is unusable with a screen reader and gives crawlers nothing stable.
       * Assistive tech and crawlers read every audience once; sighted users see the
       * cycle. Announcing each change via aria-live would be worse, not better.
       */}
      <span className="sr-only">{audienceKeys.map((key) => t(key)).join(', ')}</span>
      <span key={labelIndex} aria-hidden="true" className={animatedLabel()}>
        {t(audienceKeys[labelIndex]!)}
      </span>
    </h1>
  );
}
