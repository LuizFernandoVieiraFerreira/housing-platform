import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const audienceKeys = [
  'home.audiences.internationalStudents',
  'home.audiences.businessStay',
  'home.audiences.monthlyTravelers',
] as const;

export function HomeHeroHeadline() {
  const { t } = useTranslation('search');
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLabelIndex((current) => (current + 1) % audienceKeys.length);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentLabel = t(audienceKeys[labelIndex]!);

  return (
    <h1 className="home-headline-title text-ink">
      {t('home.heroPrefix')}{' '}
      <span
        key={labelIndex}
        aria-live="polite"
        className="text-brand-500 animate-hero-label-fade-in inline-block motion-reduce:animate-none"
      >
        {currentLabel}
      </span>
    </h1>
  );
}
