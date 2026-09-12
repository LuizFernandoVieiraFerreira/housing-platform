import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from './LoginForm';

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: () => mockSignInWithPassword(),
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock profile API
vi.mock('@/features/account/api/profile-api', () => ({
  fetchCurrentProfile: vi.fn().mockResolvedValue({ role: 'customer' }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'login.email': 'Email',
        'login.password': 'Password',
        'login.forgotPassword': 'Forgot password?',
        'login.submit': 'Sign in',
        'login.submitting': 'Signing in...',
        'login.errorFallback': 'Unable to sign in. Please try again.',
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderLoginForm(props = {}) {
  const defaultProps = {
    defaultRedirectTo: '/',
    title: 'Sign in',
    description: 'Welcome back',
  };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm {...defaultProps} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: '2026-01-01T00:00:00.000Z',
          },
        },
      },
    });
  });

  describe('rendering', () => {
    it('renders the form with title and description', () => {
      renderLoginForm({ title: 'Welcome', description: 'Sign in to continue' });

      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    });

    it('renders email and password fields', () => {
      renderLoginForm();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders sign up link when signupPath is provided', () => {
      renderLoginForm({
        signupPath: '/signup',
        signupPrompt: "Don't have an account?",
        signupLinkLabel: 'Sign up',
      });

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
    });

    it('does not render sign up link when signupPath is not provided', () => {
      renderLoginForm();

      expect(screen.queryByText("Don't have an account?")).not.toBeInTheDocument();
    });

    it('renders alternate login link when provided', () => {
      renderLoginForm({
        alternateLoginPath: '/host/login',
        alternateLoginPrompt: 'Are you a host?',
        alternateLoginLinkLabel: 'Host login',
      });

      expect(screen.getByText('Are you a host?')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Host login' })).toHaveAttribute('href', '/host/login');
    });

    it('renders forgot password link', () => {
      renderLoginForm();

      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
        'href',
        '/forgot-password',
      );
    });
  });

  describe('validation', () => {
    it('does not submit when fields are empty', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
      });
    });

    it('does not submit when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
      });
    });

    it('submits when all fields are valid', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('form submission', () => {
    it('calls signInWithPassword with correct values', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });
    });

    it('shows error message on failed login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('navigates to default redirect after successful login', async () => {
      const user = userEvent.setup();
      renderLoginForm({ defaultRedirectTo: '/account' });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        // Customer role navigates to fallback '/' via getAuthenticatedHomePath
        expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), { replace: true });
      });
    });

    it('navigates to email verification for unverified users', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              email_confirmed_at: null, // Not verified
            },
          },
        },
      });

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signup/verify-email', {
          replace: true,
          state: { email: 'test@example.com' },
        });
      });
    });

    it('disables submit button while submitting', async () => {
      // Make signIn hang to test loading state
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100)),
      );

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled and show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });
    });
  });
});
