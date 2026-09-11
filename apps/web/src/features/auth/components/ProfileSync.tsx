import {
  applyRoleTheme,
  resolvePathThemeKey,
  resolveRoleThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import { useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';

import { fetchCurrentProfile } from '@/features/account/api/profile-api';
import { fromProfileLanguage } from '@/i18n/config';
import { changeLanguage } from '@/i18n/index';

interface ProfileSyncProps {
  userId: string | undefined;
  isAuthLoading: boolean;
}

function applyLoggedOutTheme() {
  applyRoleTheme(document.documentElement, resolvePathThemeKey(window.location.pathname));
}

/**
 * Syncs preferred language after login.
 * Brand theming for authenticated users is owned by PortalThemeSync.
 */
export function ProfileSync({ userId, isAuthLoading }: ProfileSyncProps) {
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      applyLoggedOutTheme();
      return;
    }

    let cancelled = false;

    void fetchCurrentProfile(userId).then((profile) => {
      if (cancelled) {
        return;
      }

      // Seed theme until PortalThemeSync takes over (hosts may override via portal mode).
      applyRoleTheme(document.documentElement, resolveRoleThemeKey(profile?.role, true));

      if (!profile?.preferred_language) {
        return;
      }

      void changeLanguage(fromProfileLanguage(profile.preferred_language)).then(() => {
        if (!cancelled) {
          void queryClient.invalidateQueries();
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, queryClient, userId]);

  return null;
}
