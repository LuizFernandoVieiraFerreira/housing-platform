import { Outlet } from 'react-router-dom';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import { SiteFooter } from '@/app/layouts/SiteFooter';
import { SiteHeader } from '@/app/layouts/SiteHeader';

export function PublicLayout() {
  return (
    <div className="bg-surface flex flex-col">
      <MobileAppBanner />
      <SiteHeader />
      <main className="min-h-[calc(100dvh-4rem)] pb-16 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
