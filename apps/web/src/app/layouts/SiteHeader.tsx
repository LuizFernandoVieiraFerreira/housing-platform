import { Link, NavLink } from 'react-router-dom';
import { Button } from '@housing-platform/ui';
import { useTranslation } from 'react-i18next';

import { PortalSwitchButton } from '@/app/layouts/PortalSwitchButton';
import { ProfessionalPlatformsMenu } from '@/app/layouts/ProfessionalPlatformsMenu';
import { UserAvatarMenu } from '@/app/layouts/UserAvatarMenu';
import { getHomePathForRole, getVisibleNavItems } from '@/app/layouts/nav-items';
import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { LocaleSwitcher } from '@/i18n/components/LocaleSwitcher';
import { Logo } from '@/shared/components/Logo';

function navLinkClassName(isActive: boolean): string {
  return [
    'relative py-1 text-sm font-semibold transition-colors',
    isActive
      ? 'text-brand-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-600'
      : 'text-ink-muted hover:text-brand-600',
  ].join(' ');
}

export function SiteHeader() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const { mode } = usePortalMode();

  const effectiveRole =
    isAuthenticated && isEmailVerified
      ? mode === 'guest'
        ? 'customer'
        : profile?.role === 'admin'
          ? 'admin'
          : 'host'
      : undefined;

  const homePath =
    mode === 'guest' ? '/' : getHomePathForRole(profile?.role === 'admin' ? 'admin' : 'host');
  const headerNavItems = getVisibleNavItems(effectiveRole, {
    isAuthenticated: isAuthenticated && isEmailVerified,
    desktopHeaderOnly: true,
  });

  return (
    <header className="border-surface-subtle relative z-30 border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Link to={homePath} className="shrink-0" aria-label="Housing Platform">
          <Logo />
        </Link>

        <nav
          aria-label="Primary"
          className="md:gap-nav absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex md:items-center"
        >
          {headerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navLinkClassName(isActive)}
            >
              {t(`nav.${item.labelKey}`)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <PortalSwitchButton />
          <LocaleSwitcher />

          {isLoading ? (
            <span className="text-ink-muted text-sm">{t('header.loading')}</span>
          ) : isAuthenticated && isEmailVerified ? (
            <>
              <NotificationBell />
              <UserAvatarMenu />
            </>
          ) : (
            <>
              {/* Hidden on small screens, where the home page role band and footer carry these links. */}
              <div className="hidden md:block">
                <ProfessionalPlatformsMenu />
              </div>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t('header.logIn')}
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">{t('header.signUp')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
