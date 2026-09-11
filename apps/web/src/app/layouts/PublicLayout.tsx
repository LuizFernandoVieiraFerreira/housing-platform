import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import { SiteFooter } from '@/app/layouts/SiteFooter';
import { SiteHeader } from '@/app/layouts/SiteHeader';

interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="bg-surface flex flex-col">
      <MobileAppBanner />
      <SiteHeader />
      <main className="min-h-[calc(100dvh-4rem)] pb-16 md:pb-0">
        {children ?? <Outlet />}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
