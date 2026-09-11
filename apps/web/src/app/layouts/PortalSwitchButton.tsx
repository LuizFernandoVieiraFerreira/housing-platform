import { Building2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@housing-platform/ui';

import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';

function isHostArea(pathname: string): boolean {
  return pathname === '/host' || pathname.startsWith('/host/');
}

export function PortalSwitchButton() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const { isAuthenticated, isEmailVerified } = useAuth();
  const { canUseHostPortal, switchToGuest, switchToHost } = usePortalMode();

  if (!isAuthenticated || !isEmailVerified) {
    return null;
  }

  // Only dual-mode hosts get the switch control.
  if (!canUseHostPortal) {
    return null;
  }

  if (isHostArea(pathname)) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 px-2"
        onClick={switchToGuest}
      >
        <Home size={16} aria-hidden />
        <span className="hidden sm:inline">{t('header.switchToGuest')}</span>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="gap-1.5 px-2" onClick={switchToHost}>
      <Building2 size={16} aria-hidden />
      <span className="hidden sm:inline">{t('header.switchToHost')}</span>
    </Button>
  );
}
