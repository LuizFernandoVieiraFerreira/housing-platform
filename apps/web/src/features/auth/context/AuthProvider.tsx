import {
  applyRoleTheme,
  resolvePathThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ProfileSync } from '@/features/auth/components/ProfileSync';
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/shared/api/supabase';

function applyLoggedOutTheme() {
  applyRoleTheme(document.documentElement, resolvePathThemeKey(window.location.pathname));
}

function syncAuthSession(
  nextSession: Session | null,
  signal: AbortSignal,
  setSession: (session: Session | null) => void,
  setIsLoading: (isLoading: boolean) => void,
) {
  if (signal.aborted) {
    return;
  }

  setSession(nextSession);
  setIsLoading(false);

  if (!nextSession?.user) {
    applyLoggedOutTheme();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncAuthSession(nextSession, abortController.signal, setSession, setIsLoading);
    });

    return () => {
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    applyLoggedOutTheme();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      isEmailVerified: Boolean(session?.user?.email_confirmed_at),
      signOut,
    }),
    [isLoading, session, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      <ProfileSync userId={value.user?.id} isAuthLoading={isLoading} />
      {children}
    </AuthContext.Provider>
  );
}
