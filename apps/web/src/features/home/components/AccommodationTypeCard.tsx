import type { AccommodationType } from '@housing-platform/types';
import { cn } from '@housing-platform/utils';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buildSearchParams, SEOUL_CENTER } from '@/features/search/lib/search-params';

/*
 * Spelled out rather than built from the slug so Tailwind's scanner sees every class.
 * These are fixed marketing colours, not `brand.*`, so they survive role re-theming.
 */
const colorClasses: Record<AccommodationType, string> = {
  'share-house': 'bg-marketing-share-house hover:bg-marketing-share-house-hover',
  studio: 'bg-marketing-studio hover:bg-marketing-studio-hover',
  'micro-studio': 'bg-marketing-micro-studio hover:bg-marketing-micro-studio-hover',
  'multi-bedroom': 'bg-marketing-multi-bedroom hover:bg-marketing-multi-bedroom-hover',
};

interface AccommodationTypeCardProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  slug: AccommodationType;
}

export function AccommodationTypeCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  slug,
}: AccommodationTypeCardProps) {
  return (
    <Link
      to={{
        pathname: '/map',
        search: buildSearchParams({ propertyType: slug, ...SEOUL_CENTER }).toString(),
      }}
      className={cn(
        'block p-4 text-white',
        // Lift on hover only from `sm` up, where the cards stop being full-bleed pairs.
        'sm:motion-safe:transition-transform sm:motion-safe:duration-300 sm:motion-safe:hover:-translate-y-[2%]',
        // At `xl` the four cards flatten into one row and gain the top highlight rule.
        'xl:max-w-[180px] xl:shrink-0 xl:basis-[15.3%] xl:border-t-[5px] xl:border-white/30',
        colorClasses[slug],
      )}
    >
      <Icon
        aria-hidden="true"
        className="-mr-1.5 -mt-1.5 mb-1 ml-auto block h-7 w-7 opacity-60 xl:mb-[60px] xl:ml-0 xl:mr-0 xl:mt-0"
      />
      <h3 className="text-base font-bold">
        <span className="block text-[80%] font-normal leading-none">{eyebrow}</span>
        {title}
      </h3>
      {/* Hidden on phones, where the two-up cards have no room for a strapline. */}
      <p className="mt-1 hidden text-sm italic opacity-60 md:block">{description}</p>
    </Link>
  );
}
