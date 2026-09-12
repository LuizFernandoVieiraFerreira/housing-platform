import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth';
import { CurrencyProvider } from '@/i18n/CurrencyProvider';
import { createPropertyDetail, createPropertyRoom } from '@/test/fixtures/property';

import { BookingPanel } from './BookingPanel';

// Mock the booking hooks
const mockMutateAsync = vi.fn();
const mockUseBookingQuote = vi.fn();

vi.mock('@/features/booking/hooks/useBooking', () => ({
  useBookingQuote: (input: unknown) => mockUseBookingQuote(input),
  useCreateBookingHold: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
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

function createAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    isEmailVerified: false,
    signOut: vi.fn(),
    ...overrides,
  };
}

function renderBookingPanel(
  property = createPropertyDetail(),
  authValue = createAuthContext(),
  initialEntries = ['/listings/property-1'],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          <CurrencyProvider>
            <BookingPanel property={property} />
          </CurrencyProvider>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('BookingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookingQuote.mockReturnValue({
      data: null,
      isFetching: false,
      error: null,
    });
  });

  describe('when user is not authenticated', () => {
    it('shows sign in prompt with property price', () => {
      renderBookingPanel();

      expect(screen.getByText(/sign in to book/i)).toBeInTheDocument();
      expect(screen.getByText(/₩800,000/)).toBeInTheDocument();
      expect(screen.getByText(/minimum stay: 30 nights/i)).toBeInTheDocument();
    });

    it('renders link to login with returnTo param', () => {
      renderBookingPanel();

      const signInLink = screen.getByRole('link', { name: /sign in to book/i });
      expect(signInLink).toHaveAttribute(
        'href',
        expect.stringContaining('/login?returnTo='),
      );
    });
  });

  describe('when user is authenticated but email not verified', () => {
    it('shows email verification message', () => {
      const authValue = createAuthContext({
        isAuthenticated: true,
        isEmailVerified: false,
        user: { id: 'user-1', email: 'test@example.com' } as AuthContextValue['user'],
      });

      renderBookingPanel(createPropertyDetail(), authValue);

      expect(screen.getByText(/verify your email before booking/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to verification/i })).toBeInTheDocument();
    });
  });

  describe('when no rooms are available', () => {
    it('shows no availability message', () => {
      const property = createPropertyDetail({
        rooms: [createPropertyRoom({ status: 'occupied' })],
      });
      const authValue = createAuthContext({
        isAuthenticated: true,
        isEmailVerified: true,
      });

      renderBookingPanel(property, authValue);

      expect(screen.getByText(/no rooms are currently available/i)).toBeInTheDocument();
    });
  });

  describe('when user is authenticated with verified email', () => {
    const verifiedAuth = createAuthContext({
      isAuthenticated: true,
      isEmailVerified: true,
      user: { id: 'user-1', email: 'test@example.com' } as AuthContextValue['user'],
    });

    it('shows the booking form', () => {
      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/guests/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes for the host/i)).toBeInTheDocument();
    });

    it('shows room selector when multiple rooms available', () => {
      const property = createPropertyDetail({
        rooms: [
          createPropertyRoom({ id: 'room-1', name: 'Room A' }),
          createPropertyRoom({ id: 'room-2', name: 'Room B' }),
        ],
      });

      renderBookingPanel(property, verifiedAuth);

      expect(screen.getByLabelText(/room/i)).toBeInTheDocument();
    });

    it('hides room selector when only one room available', () => {
      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      expect(screen.queryByLabelText(/room/i)).not.toBeInTheDocument();
    });

    it('shows instant book text for instant booking properties', () => {
      renderBookingPanel(createPropertyDetail({ bookingMode: 'instant' }), verifiedAuth);

      // Check the property info line mentions instant book
      expect(screen.getByText(/minimum stay.*instant book/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reserve and pay next/i })).toBeInTheDocument();
    });

    it('shows request to book text for request booking properties', () => {
      renderBookingPanel(createPropertyDetail({ bookingMode: 'request' }), verifiedAuth);

      // Check the property info line mentions request to book
      expect(screen.getByText(/minimum stay.*request to book/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request to book/i })).toBeInTheDocument();
    });
  });

  describe('quote calculation', () => {
    const verifiedAuth = createAuthContext({
      isAuthenticated: true,
      isEmailVerified: true,
      user: { id: 'user-1', email: 'test@example.com' } as AuthContextValue['user'],
    });

    it('shows quote when available', async () => {
      mockUseBookingQuote.mockReturnValue({
        data: {
          roomId: 'room-1',
          propertyId: 'property-1',
          bookingMode: 'instant',
          nights: 30,
          rentKrw: 800_000,
          serviceFeeKrw: 80_000,
          totalKrw: 880_000,
          pricingVersion: 'v1',
        },
        isFetching: false,
        error: null,
      });

      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      // Check quote breakdown is displayed
      expect(screen.getByText(/rent \(30 nights\)/i)).toBeInTheDocument();
      expect(screen.getByText(/service fee/i)).toBeInTheDocument();
      // Check total amount (₩880,000 should be unique as the total)
      expect(screen.getByText('₩880,000')).toBeInTheDocument();
    });

    it('shows loading state while calculating', () => {
      mockUseBookingQuote.mockReturnValue({
        data: null,
        isFetching: true,
        error: null,
      });

      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      expect(screen.getByText(/calculating price/i)).toBeInTheDocument();
    });

    it('shows error when quote fails', () => {
      mockUseBookingQuote.mockReturnValue({
        data: null,
        isFetching: false,
        error: new Error('Quote failed'),
      });

      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      // Error message comes from the error object via getBookingErrorMessage
      expect(screen.getByText(/quote failed/i)).toBeInTheDocument();
    });
  });

  describe('form submission state', () => {
    const verifiedAuth = createAuthContext({
      isAuthenticated: true,
      isEmailVerified: true,
      user: { id: 'user-1', email: 'test@example.com' } as AuthContextValue['user'],
    });

    it('disables submit button when no quote available', () => {
      mockUseBookingQuote.mockReturnValue({
        data: null,
        isFetching: false,
        error: null,
      });

      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      expect(screen.getByRole('button', { name: /reserve and pay next/i })).toBeDisabled();
    });

    it('enables submit button when quote is available', () => {
      mockUseBookingQuote.mockReturnValue({
        data: {
          roomId: 'room-1',
          propertyId: 'property-1',
          bookingMode: 'instant',
          nights: 30,
          rentKrw: 800_000,
          serviceFeeKrw: 80_000,
          totalKrw: 880_000,
          pricingVersion: 'v1',
        },
        isFetching: false,
        error: null,
      });

      renderBookingPanel(createPropertyDetail(), verifiedAuth);

      expect(screen.getByRole('button', { name: /reserve and pay next/i })).not.toBeDisabled();
    });
  });
});
