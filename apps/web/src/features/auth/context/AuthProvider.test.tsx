import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onAuthStateChangeMock, unsubscribeMock, authStateCallbackRef, getSessionMock } = vi.hoisted(
  () => {
    const unsubscribeMock = vi.fn();
    const authStateCallbackRef = {
      current: null as null | ((event: string, session: unknown) => void),
    };
    const onAuthStateChangeMock = vi.fn((callback: (event: string, session: unknown) => void) => {
      authStateCallbackRef.current = callback;

      return { data: { subscription: { unsubscribe: unsubscribeMock } } };
    });
    const getSessionMock = vi.fn();

    return { onAuthStateChangeMock, unsubscribeMock, authStateCallbackRef, getSessionMock };
  },
);

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('@/features/auth/components/ProfileSync', () => ({
  ProfileSync: () => null,
}));

import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user-id">{auth.user?.id ?? 'none'}</span>
    </div>
  );
}

function renderAuthProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallbackRef.current = null;
  });

  it('resolves auth state from onAuthStateChange without calling getSession', async () => {
    renderAuthProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(getSessionMock).not.toHaveBeenCalled();

    authStateCallbackRef.current?.('INITIAL_SESSION', {
      user: { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
    });

    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount and ignores late auth events', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const view = renderAuthProvider();

    authStateCallbackRef.current?.('INITIAL_SESSION', null);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    view.unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);

    authStateCallbackRef.current?.('SIGNED_IN', {
      user: { id: 'user-late', email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringMatching(/Can't perform a React state update on an unmounted component/i),
    );

    consoleError.mockRestore();
  });
});
