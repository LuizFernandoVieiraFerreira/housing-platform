import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import { MobileAppBanner } from '@/app/layouts/MobileAppBanner';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import { SiteFooter } from '@/app/layouts/SiteFooter';
import { PortalModeProvider } from '@/app/providers/PortalModeProvider';
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth';
import { MapSearchPage } from '@/features/search/pages/MapSearchPage';
import { renderWithProviders } from '@/test/render';

vi.mock('@/features/account/hooks/useProfile', () => ({
  useCurrentProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@/features/host/hooks/useHost', () => ({
  useCurrentHost: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

const guestAuthValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isEmailVerified: false,
  signOut: vi.fn(),
};

function renderWithRouter(ui: ReactElement, initialEntries: string[] = ['/']) {
  return renderWithProviders(
    <AuthContext.Provider value={guestAuthValue}>
      <PortalModeProvider>{ui}</PortalModeProvider>
    </AuthContext.Provider>,
    { initialEntries },
  );
}

describe('MobileAppBanner', () => {
  it('renders the app download banner link', () => {
    renderWithRouter(<MobileAppBanner />);

    expect(
      screen.getByRole('link', { name: /Housing Platform App Released! Download Now!/i }),
    ).toHaveAttribute('href', '#');
  });
});

describe('MobileBottomNav', () => {
  it('renders browse-only links for logged-out users', () => {
    renderWithRouter(<MobileBottomNav />);

    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Map' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Booking' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My' })).not.toBeInTheDocument();
  });
});

describe('SiteFooter', () => {
  it('renders footer links and copyright', () => {
    renderWithRouter(<SiteFooter />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/Terms & Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Housing Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/support@housing-platform.dev/i)).toBeInTheDocument();
    expect(screen.getByText(/Download the Housing Platform app/i)).toBeInTheDocument();
    expect(screen.getByText(/Business information/i)).toBeInTheDocument();
  });
});

describe('MapSearchPage', () => {
  it('renders the map section with flexible height on mobile', () => {
    renderWithRouter(<MapSearchPage />, ['/map']);

    const mapSection = screen.getByRole('region', { name: 'Map' });
    expect(mapSection).toBeInTheDocument();
    expect(mapSection.className).toContain('flex-1');
  });
});
