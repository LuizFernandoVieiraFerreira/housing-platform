import { Outlet } from 'react-router-dom';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import { SiteHeader } from '@/app/layouts/SiteHeader';

export function MapLayout() {
  return (
    <div className="bg-surface flex h-dvh flex-col overflow-hidden">
      <MobileAppBanner />
      <SiteHeader />
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
