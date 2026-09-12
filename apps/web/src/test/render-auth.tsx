import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';

import { PortalModeProvider } from '@/app/providers/PortalModeProvider';
import type { AuthContextValue } from '@/features/auth/hooks/useAuth';
import { AuthContext } from '@/features/auth/hooks/useAuth';

interface RenderWithAuthOptions {
  initialEntries?: MemoryRouterProps['initialEntries'];
  queryClient?: QueryClient;
}

export function renderWithAuth(
  ui: ReactElement,
  authValue: AuthContextValue,
  initialEntries: MemoryRouterProps['initialEntries'] = ['/'],
  options: Omit<RenderWithAuthOptions, 'initialEntries'> = {},
): RenderResult {
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          <PortalModeProvider>{ui}</PortalModeProvider>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

export const baseAuthValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isEmailVerified: false,
  signOut: vi.fn(),
};
