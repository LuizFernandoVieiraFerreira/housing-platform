import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccommodationTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  slug: string;
}

export function AccommodationTypeCard({
  title,
  description,
  icon: Icon,
  slug,
}: AccommodationTypeCardProps) {
  return (
    <Link
      to={`/map?propertyType=${slug}`}
      className="h-accommodation-card shadow-panel duration-interaction hover:scale-card-hover active:scale-card-active relative flex flex-col items-center justify-center gap-3 rounded-lg bg-white px-4 text-center transition-transform motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="bg-brand-50 text-brand-600 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-ink text-sm font-bold">{title}</h3>
        <p className="text-ink-muted text-xs">{description}</p>
      </div>
    </Link>
  );
}
