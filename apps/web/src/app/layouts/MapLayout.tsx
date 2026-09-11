import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import { SiteHeader } from '@/app/layouts/SiteHeader';

interface MapLayoutProps {
  children?: ReactNode;
}

export function MapLayout({ children }: MapLayoutProps) {
  return (
    <div className="bg-surface flex h-dvh flex-col overflow-hidden">
      <MobileAppBanner />
      <SiteHeader />
      <main className="min-h-0 flex-1">
        {children ?? <Outlet />}
      </main>
      <MobileBottomNav />
    </div>
  );
}
