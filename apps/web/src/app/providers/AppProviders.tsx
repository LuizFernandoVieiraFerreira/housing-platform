import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { composeProviders } from '@/app/providers/composeProviders';
import { PortalModeProvider } from '@/app/providers/PortalModeProvider';
import { PortalThemeSync } from '@/app/providers/PortalThemeSync';
import { ScrollToTop } from '@/app/providers/ScrollToTop';
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { NotificationProvider } from '@/features/notifications/components/NotificationProvider';
import { ChannelWidget } from '@/features/support/components/ChannelWidget';
import { CurrencyProvider } from '@/i18n/CurrencyProvider';
import { createQueryClientOptions } from '@/shared/lib/query-errors';

// ============================================================================
// Query Client
// ============================================================================

const queryClient = new QueryClient(createQueryClientOptions());

// ============================================================================
// Provider Composition
// ============================================================================

/**
 * Core providers that wrap the entire application.
 *
 * Order matters: first in list = outermost in tree.
 * - QueryClientProvider: Data fetching (no dependencies)
 * - CurrencyProvider: i18n currency formatting (no dependencies)
 * - AuthProvider: Authentication state (depends on QueryClient)
 * - BrowserRouter: Routing (no dependencies)
 * - PortalModeProvider: Guest/Host mode switching (depends on Auth, Router)
 * - NotificationProvider: Notification state (depends on Auth)
 */
const CoreProviders = composeProviders([
  [QueryClientProvider, { client: queryClient }],
  CurrencyProvider,
  AuthProvider,
  BrowserRouter,
  PortalModeProvider,
  NotificationProvider,
]);

// ============================================================================
// App Providers
// ============================================================================

/**
 * Root provider component that wraps the application.
 *
 * Includes:
 * - All context providers (via CoreProviders)
 * - Utility components (ScrollToTop, PortalThemeSync)
 * - Global widgets (ChannelWidget)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CoreProviders>
      {/* Utility components that need router context */}
      <ScrollToTop />
      <PortalThemeSync />

      {/* Main content */}
      {children}

      {/* Global widgets */}
      <ChannelWidget />
    </CoreProviders>
  );
}
