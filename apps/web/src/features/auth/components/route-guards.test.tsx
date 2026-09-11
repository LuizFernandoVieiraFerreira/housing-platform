import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { MarketplaceRoute } from '@/features/auth/components/MarketplaceRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import type { AuthContextValue } from '@/features/auth/hooks/useAuth';
import { AuthContext } from '@/features/auth/hooks/useAuth';

vi.mock('@/features/account/hooks/useProfile', () => ({
  useCurrentProfile: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}));

vi.mock('@/features/host/hooks/useHost', () => ({
  useCurrentHost: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}));

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useCurrentHost } from '@/features/host/hooks/useHost';
import { PortalModeProvider } from '@/app/providers/PortalModeProvider';

const mockedUseCurrentProfile = vi.mocked(useCurrentProfile);
const mockedUseCurrentHost = vi.mocked(useCurrentHost);

function LocationDisplay() {
  const location = useLocation();

  return (
    <p>
      Current route: {location.pathname}
      {location.search}
    </p>
  );
}

function renderWithAuth(
  ui: React.ReactElement,
  authValue: AuthContextValue,
  initialEntries: string[] = ['/protected'],
) {
  const queryClient = new QueryClient({
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

const baseAuthValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isEmailVerified: false,
  signOut: vi.fn(),
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCurrentProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);
  });

  it('shows a loading state while auth is resolving', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
      </Routes>,
      { ...baseAuthValue, isLoading: true },
    );

    expect(screen.getByText('Loading your account...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login with returnTo', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/bookings" element={<p>Protected content</p>} />
        </Route>
        <Route
          path="/login"
          element={
            <>
              <p>Login page</p>
              <LocationDisplay />
            </>
          }
        />
      </Routes>,
      baseAuthValue,
      ['/bookings?status=confirmed'],
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(
      screen.getByText('Current route: /login?returnTo=%2Fbookings%3Fstatus%3Dconfirmed'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects authenticated but unverified users to email verification', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
        <Route path="/signup/verify-email" element={<p>Verify email</p>} />
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: false,
        user: { email: 'guest@example.com' } as AuthContextValue['user'],
      },
    );

    expect(screen.getByText('Verify email')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated verified users', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
      },
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCurrentProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);
  });

  it('shows a loading state while auth is resolving', () => {
    renderWithAuth(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>Login form</p>} />
        </Route>
      </Routes>,
      { ...baseAuthValue, isLoading: true },
      ['/login'],
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('redirects authenticated verified users based on role', () => {
    mockedUseCurrentProfile.mockReturnValue({
      data: { role: 'host' },
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);

    renderWithAuth(
      <Routes>
        <Route element={<GuestRoute defaultRedirect="/" />}>
          <Route path="/login" element={<p>Login form</p>} />
        </Route>
        <Route path="/host" element={<p>Host home</p>} />
        <Route path="/" element={<p>Customer home</p>} />
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
        user: { id: 'user-1' } as AuthContextValue['user'],
      },
      ['/login'],
    );

    expect(screen.getByText('Host home')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('redirects authenticated customers to defaultRedirect', () => {
    mockedUseCurrentProfile.mockReturnValue({
      data: { role: 'customer' },
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);

    renderWithAuth(
      <Routes>
        <Route element={<GuestRoute defaultRedirect="/" />}>
          <Route path="/login" element={<p>Login form</p>} />
        </Route>
        <Route path="/" element={<p>Customer home</p>} />
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
        user: { id: 'user-1' } as AuthContextValue['user'],
      },
      ['/login'],
    );

    expect(screen.getByText('Customer home')).toBeInTheDocument();
  });

  it('renders guest routes for unauthenticated users', () => {
    renderWithAuth(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>Login form</p>} />
        </Route>
      </Routes>,
      baseAuthValue,
      ['/login'],
    );

    expect(screen.getByText('Login form')).toBeInTheDocument();
  });
});

describe('MarketplaceRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockedUseCurrentProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);
    mockedUseCurrentHost.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCurrentHost>);
  });

  it('allows unauthenticated visitors', () => {
    renderWithAuth(
      <Routes>
        <Route element={<MarketplaceRoute />}>
          <Route path="/map" element={<p>Map page</p>} />
        </Route>
      </Routes>,
      baseAuthValue,
      ['/map'],
    );

    expect(screen.getByText('Map page')).toBeInTheDocument();
  });

  it('allows hosts in guest portal mode', () => {
    mockedUseCurrentProfile.mockReturnValue({
      data: { role: 'host' },
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);
    mockedUseCurrentHost.mockReturnValue({
      data: { id: 'host-1' },
      isLoading: false,
    } as ReturnType<typeof useCurrentHost>);
    window.localStorage.setItem('housing-platform.portal-mode.user-1', 'guest');

    renderWithAuth(
      <Routes>
        <Route element={<MarketplaceRoute />}>
          <Route path="/map" element={<p>Map page</p>} />
        </Route>
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
        user: { id: 'user-1' } as AuthContextValue['user'],
      },
      ['/map'],
    );

    expect(screen.getByText('Map page')).toBeInTheDocument();
  });

  it('redirects hosts in host portal mode to the host portal', () => {
    mockedUseCurrentProfile.mockReturnValue({
      data: { role: 'host' },
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);
    mockedUseCurrentHost.mockReturnValue({
      data: { id: 'host-1' },
      isLoading: false,
    } as ReturnType<typeof useCurrentHost>);

    window.localStorage.setItem('housing-platform.portal-mode.user-1', 'host');

    renderWithAuth(
      <Routes>
        <Route element={<MarketplaceRoute />}>
          <Route path="/map" element={<p>Map page</p>} />
        </Route>
        <Route path="/host" element={<p>Host portal</p>} />
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
        user: { id: 'user-1' } as AuthContextValue['user'],
      },
      ['/map'],
    );

    expect(screen.getByText('Host portal')).toBeInTheDocument();
    expect(screen.queryByText('Map page')).not.toBeInTheDocument();
  });

  it('redirects admins to the admin console', () => {
    mockedUseCurrentProfile.mockReturnValue({
      data: { role: 'admin' },
      isLoading: false,
    } as ReturnType<typeof useCurrentProfile>);

    renderWithAuth(
      <Routes>
        <Route element={<MarketplaceRoute />}>
          <Route path="/" element={<p>Home page</p>} />
        </Route>
        <Route path="/admin" element={<p>Admin console</p>} />
      </Routes>,
      {
        ...baseAuthValue,
        isAuthenticated: true,
        isEmailVerified: true,
        user: { id: 'user-1' } as AuthContextValue['user'],
      },
      ['/'],
    );

    expect(screen.getByText('Admin console')).toBeInTheDocument();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });
});
