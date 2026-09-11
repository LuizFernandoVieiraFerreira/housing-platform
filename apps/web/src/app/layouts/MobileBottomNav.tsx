import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getVisibleNavItems } from '@/app/layouts/nav-items';
import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useCurrentProfile } from '@/features/account';
import { useAuth } from '@/features/auth';

export function MobileBottomNav() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, isEmailVerified } = useAuth();
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

  const items = getVisibleNavItems(effectiveRole, {
    isAuthenticated: isAuthenticated && isEmailVerified,
  });

  return (
    <nav
      aria-label="Mobile navigation"
      className="border-surface-subtle fixed inset-x-0 bottom-0 z-40 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-16">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                isActive ? 'text-brand-600' : 'text-ink-muted',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span>{t(`nav.${item.labelKey}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
