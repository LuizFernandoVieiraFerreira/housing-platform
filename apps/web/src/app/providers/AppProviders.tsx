import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { PortalModeProvider } from '@/app/providers/PortalModeProvider';
import { PortalThemeSync } from '@/app/providers/PortalThemeSync';
import { ScrollToTop } from '@/app/providers/ScrollToTop';
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { NotificationProvider } from '@/features/notifications/components/NotificationProvider';
import { ChannelWidget } from '@/features/support/components/ChannelWidget';
import { CurrencyProvider } from '@/i18n/CurrencyProvider';
import { createQueryClientOptions } from '@/shared/lib/query-errors';

const queryClient = new QueryClient(createQueryClientOptions());

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <AuthProvider>
          <BrowserRouter>
            <PortalModeProvider>
              <ScrollToTop />
              <PortalThemeSync />
              <NotificationProvider>
                {children}
                <ChannelWidget />
              </NotificationProvider>
            </PortalModeProvider>
          </BrowserRouter>
        </AuthProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
