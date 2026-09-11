import {
  applyRoleTheme,
  resolvePathThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import { Card } from '@housing-platform/ui';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { Logo } from '@/shared/components/Logo';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { pathname } = useLocation();
  const theme = resolvePathThemeKey(pathname);
  const isWide = theme === 'host';

  useLayoutEffect(() => {
    applyRoleTheme(document.documentElement, theme);
  }, [theme]);

  return (
    <div className="bg-surface-muted flex min-h-screen flex-col">
      <MobileAppBanner />
      <header className="border-surface-subtle relative z-30 border-b bg-white">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="Housing Platform">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Card
          variant="elevated"
          padding="lg"
          className={isWide ? 'w-full max-w-lg' : 'w-full max-w-md'}
        >
          {children ?? <Outlet />}
        </Card>
      </main>
    </div>
  );
}
