import {
  applyRoleTheme,
  resolvePathThemeKey,
  type RoleThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import { useLayoutEffect } from 'react';

import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

function themeForPortal(mode: 'guest' | 'host', role: string | undefined): RoleThemeKey {
  if (!role) {
    return resolvePathThemeKey(window.location.pathname);
  }

  if (role === 'admin') {
    return 'admin';
  }

  if (role === 'host') {
    return mode === 'host' ? 'host' : 'customer';
  }

  return 'customer';
}

/** Keeps brand colors aligned with guest/host portal mode for dual-mode hosts. */
export function PortalThemeSync() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const { mode } = usePortalMode();

  useLayoutEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      applyRoleTheme(document.documentElement, resolvePathThemeKey(window.location.pathname));
      return;
    }

    applyRoleTheme(document.documentElement, themeForPortal(mode, profile?.role));
  }, [isAuthenticated, isLoading, mode, profile?.role]);

  return null;
}
