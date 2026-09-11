import type { AccommodationType } from '@housing-platform/types';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

// Spelled out rather than built from the slug so Tailwind's scanner keeps these rules.
const colorClasses: Record<AccommodationType, string> = {
  'share-house': 'home-type-card--share-house',
  studio: 'home-type-card--studio',
  'micro-studio': 'home-type-card--micro-studio',
  'multi-bedroom': 'home-type-card--multi-bedroom',
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
    <Link to={`/map?propertyType=${slug}`} className={`home-type-card ${colorClasses[slug]}`}>
      <Icon className="home-type-card-icon" aria-hidden="true" />
      <h3 className="home-type-card-name">
        <span className="home-type-card-eyebrow">{eyebrow}</span>
        {title}
      </h3>
      <p className="home-type-card-description">{description}</p>
    </Link>
  );
}
