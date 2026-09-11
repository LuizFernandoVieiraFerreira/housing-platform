import {
  applyRoleTheme,
  resolveExplicitPathThemeKey,
  type RoleThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

function themeForPortal(mode: 'guest' | 'host', role: string | undefined): RoleThemeKey {
  if (!role) {
    return 'customer';
  }

  if (role === 'admin') {
    return 'admin';
  }

  if (role === 'host') {
    return mode === 'host' ? 'host' : 'customer';
  }

  return 'customer';
}

/** Keeps brand colors aligned with the role a page belongs to, then with portal mode. */
export function PortalThemeSync() {
  const { pathname } = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const { mode } = usePortalMode();

  useLayoutEffect(() => {
    if (isLoading) {
      return;
    }

    // A role-specific URL wins, so /for-hosts stays blue however the visitor arrived.
    const pathTheme = resolveExplicitPathThemeKey(pathname);

    applyRoleTheme(
      document.documentElement,
      pathTheme ?? (isAuthenticated ? themeForPortal(mode, profile?.role) : 'customer'),
    );
  }, [isAuthenticated, isLoading, mode, pathname, profile?.role]);

  return null;
}
