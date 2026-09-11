import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentHost } from '@/features/host/hooks/useHost';

export type PortalMode = 'guest' | 'host';

interface PortalModeContextValue {
  mode: PortalMode;
  /** True when the user has a host profile and can open the host portal. */
  canUseHostPortal: boolean;
  setMode: (mode: PortalMode) => void;
  switchToHost: () => void;
  switchToGuest: () => void;
}

const PortalModeContext = createContext<PortalModeContextValue | undefined>(undefined);

const STORAGE_PREFIX = 'housing-platform.portal-mode';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}.${userId}`;
}

function readStoredMode(userId: string | undefined): PortalMode | null {
  if (!userId || typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(storageKey(userId));
  return value === 'guest' || value === 'host' ? value : null;
}

function writeStoredMode(userId: string | undefined, mode: PortalMode): void {
  if (!userId || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey(userId), mode);
}

function modeFromPathname(pathname: string): PortalMode {
  return pathname === '/host' || pathname.startsWith('/host/') ? 'host' : 'guest';
}

export function PortalModeProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const { data: host } = useCurrentHost();

  const canUseHostPortal = Boolean(
    isAuthenticated &&
      isEmailVerified &&
      host &&
      (profile?.role === 'host' || profile?.role === 'admin'),
  );

  const [mode, setModeState] = useState<PortalMode>(() => {
    const stored = readStoredMode(user?.id);
    if (stored) {
      return stored;
    }
    return modeFromPathname(pathname);
  });

  const setMode = useCallback(
    (next: PortalMode) => {
      setModeState(next);
      writeStoredMode(user?.id, next);
    },
    [user?.id],
  );

  // Keep mode in sync when auth user changes.
  useEffect(() => {
    if (!user?.id) {
      setModeState(modeFromPathname(pathname));
      return;
    }

    const stored = readStoredMode(user.id);
    if (stored) {
      setModeState(stored);
      return;
    }

    if (canUseHostPortal && modeFromPathname(pathname) === 'host') {
      setModeState('host');
      return;
    }

    setModeState(canUseHostPortal && profile?.role === 'host' ? 'host' : 'guest');
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally reset on user change only

  // Entering the host area always activates host mode.
  useEffect(() => {
    if (!canUseHostPortal) {
      if (mode !== 'guest') {
        setMode('guest');
      }
      return;
    }

    if (modeFromPathname(pathname) === 'host' && mode !== 'host') {
      setMode('host');
    }
  }, [pathname, canUseHostPortal]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchToHost = useCallback(() => {
    if (!canUseHostPortal) {
      navigate('/host/register');
      return;
    }

    setMode('host');
    navigate('/host');
  }, [canUseHostPortal, navigate, setMode]);

  const switchToGuest = useCallback(() => {
    setMode('guest');
    navigate('/');
  }, [navigate, setMode]);

  const value = useMemo<PortalModeContextValue>(
    () => ({
      mode: canUseHostPortal ? mode : 'guest',
      canUseHostPortal,
      setMode,
      switchToHost,
      switchToGuest,
    }),
    [canUseHostPortal, mode, setMode, switchToGuest, switchToHost],
  );

  return <PortalModeContext.Provider value={value}>{children}</PortalModeContext.Provider>;
}

export function usePortalMode() {
  const context = useContext(PortalModeContext);

  if (!context) {
    throw new Error('usePortalMode must be used within PortalModeProvider');
  }

  return context;
}
