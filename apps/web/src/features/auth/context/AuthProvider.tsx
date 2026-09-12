import {
  applyRoleTheme,
  resolvePathThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ProfileSync } from '@/features/auth/components/ProfileSync';
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/shared/api/supabase';
import { logger } from '@/shared/lib/logger';

const log = logger.child('AuthProvider');

function applyLoggedOutTheme() {
  applyRoleTheme(document.documentElement, resolvePathThemeKey(window.location.pathname));
}

function syncAuthSession(
  event: AuthChangeEvent,
  nextSession: Session | null,
  signal: AbortSignal,
  setSession: (session: Session | null) => void,
  setIsLoading: (isLoading: boolean) => void,
) {
  if (signal.aborted) {
    log.debug('Auth state change ignored (aborted)', { action: 'syncAuthSession', data: { event } });
    return;
  }

  log.info('Auth state changed', {
    action: 'syncAuthSession',
    data: {
      event,
      userId: nextSession?.user?.id,
      email: nextSession?.user?.email,
      isAuthenticated: Boolean(nextSession?.user),
    },
  });

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
    log.debug('Setting up auth state listener', { action: 'init' });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      syncAuthSession(event, nextSession, abortController.signal, setSession, setIsLoading);
    });

    return () => {
      log.debug('Cleaning up auth state listener', { action: 'cleanup' });
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    log.info('User signing out', { action: 'signOut', userId: session?.user?.id });
    const { error } = await supabase.auth.signOut();

    if (error) {
      log.error('Sign out failed', { action: 'signOut', error });
      throw error;
    }

    log.info('User signed out successfully', { action: 'signOut' });
    applyLoggedOutTheme();
  }, [session?.user?.id]);

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
