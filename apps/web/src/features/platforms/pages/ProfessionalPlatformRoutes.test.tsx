import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { PortalModeProvider } from '@/app/providers/PortalModeProvider';
import { PROFESSIONAL_PLATFORMS } from '@/features/platforms';
import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth';
import { renderWithProviders } from '@/test/render';

vi.mock('@/features/account/hooks/useProfile', () => ({
  useCurrentProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@/features/host/hooks/useHost', () => ({
  useCurrentHost: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useUnreadNotificationCount: vi.fn(() => ({ data: 0 })),
}));

const guestAuthValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isEmailVerified: false,
  signOut: vi.fn(),
};

function renderPlatformRoute(path: string) {
  renderWithProviders(
    <AuthContext.Provider value={guestAuthValue}>
      <PortalModeProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            {PROFESSIONAL_PLATFORMS.map(({ key, landingPath }) => (
              <Route
                key={key}
                path={landingPath}
                element={<ProfessionalPlatformPage platform={key} />}
              />
            ))}
          </Route>
        </Routes>
      </PortalModeProvider>
    </AuthContext.Provider>,
    { initialEntries: [path] },
  );
}

describe('Professional platform routes', () => {
  it.each([
    {
      path: '/for-hosts',
      title: /list your place and fill it with long-stay guests/i,
      cta: /get started/i,
    },
    {
      path: '/for-photographers',
      title: /shoot the homes that guests book from across the world/i,
      cta: /coming soon/i,
    },
    {
      path: '/for-agents',
      title: /bring your listings to tenants who arrive ready to sign/i,
      cta: /coming soon/i,
    },
  ])('renders $path inside the public layout', ({ path, title, cta }) => {
    renderPlatformRoute(path);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(cta)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /footer/i })).toBeInTheDocument();
  });
});
