import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@housing-platform/ui';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { professionalPlatforms } from '@/features/platforms/lib/professional-platforms';

/**
 * One header entry for every platform that is not the guest marketplace, so adding
 * a role means adding it to the platform config rather than another header button.
 */
export function ProfessionalPlatformsMenu() {
  const { t } = useTranslation('platforms');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1">
          {t('menu.label')}
          <ChevronDown size={16} aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuHeader>
          <p className="text-ink-muted text-xs">{t('menu.description')}</p>
        </DropdownMenuHeader>

        {professionalPlatforms.map(({ key, icon: Icon, landingPath }) => (
          <DropdownMenuItem key={key} asChild>
            <Link to={landingPath} className="gap-2.5">
              <Icon size={16} aria-hidden />
              <span>{t(`${key}.menuLabel`)}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
