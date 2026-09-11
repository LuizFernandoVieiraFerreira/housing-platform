import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

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
    <h1 className="text-ink xs:text-[1.85rem] mx-auto mb-4 mt-6 text-[1.6rem] font-extrabold leading-[1.17] tracking-[-1.2px] sm:mb-3 sm:text-[2rem] lg:text-[2.8rem] lg:font-black lg:tracking-[-2.1px] xl:text-[3.3rem]">
      {t('heroPrefix')}{' '}
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
