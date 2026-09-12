import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';
import { createBookingDetail } from '@/test/fixtures/booking';
import { renderWithProviders } from '@/test/render';

const mockCreatePayment = vi.fn();
const mockConfirmPayment = vi.fn();

vi.mock('@/features/booking/hooks/useBooking', () => ({
  useBookingDetail: vi.fn(),
}));

vi.mock('@/features/checkout/hooks/usePayment', () => ({
  useCreatePaymentOrder: vi.fn(() => ({
    mutateAsync: mockCreatePayment,
    isPending: false,
  })),
  useConfirmPayment: vi.fn(() => ({
    mutateAsync: mockConfirmPayment,
    isPending: false,
  })),
}));

vi.mock('@/features/checkout/api/payment-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/checkout/api/payment-api')>();

  return {
    ...actual,
    isPaymentDevMockEnabled: () => true,
    getTossClientKey: () => null,
  };
});

import { useBookingDetail } from '@/features/booking/hooks/useBooking';

const mockedUseBookingDetail = vi.mocked(useBookingDetail);

function renderCheckoutPage(bookingId = 'booking-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
      <Route path="/bookings/:bookingId" element={<p>Booking detail page</p>} />
      <Route path="/bookings" element={<p>Bookings list</p>} />
    </Routes>,
    { initialEntries: [`/checkout/${bookingId}`] },
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePayment.mockResolvedValue({
      orderId: 'order-123',
      amountKrw: 1_100_000,
      orderName: 'Monthly stay',
    });
    mockConfirmPayment.mockResolvedValue({ bookingId: 'booking-1', status: 'confirmed' });
  });

  it('shows loading state while booking detail is fetching', () => {
    mockedUseBookingDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useBookingDetail>);

    renderCheckoutPage();

    expect(screen.getByText('Loading checkout...')).toBeInTheDocument();
  });

  it('shows not-ready message when booking status is not payable', () => {
    mockedUseBookingDetail.mockReturnValue({
      data: createBookingDetail({ status: 'confirmed' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBookingDetail>);

    renderCheckoutPage();

    expect(screen.getByText('This booking is not ready for payment.')).toBeInTheDocument();
  });

  it('shows expired hold error for pending_payment bookings past hold expiry', async () => {
    mockedUseBookingDetail.mockReturnValue({
      data: createBookingDetail({
        status: 'pending_payment',
        holdExpiresAt: '2020-01-01T00:00:00.000Z',
      }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBookingDetail>);

    renderCheckoutPage();

    await waitFor(() => {
      expect(
        screen.getByText('This booking hold has expired. Start a new booking to continue.'),
      ).toBeInTheDocument();
    });
  });

  it('simulates dev payment and navigates to booking detail', async () => {
    const user = userEvent.setup();

    mockedUseBookingDetail.mockReturnValue({
      data: createBookingDetail(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBookingDetail>);

    renderCheckoutPage();

    await user.click(screen.getByRole('button', { name: /simulate payment/i }));

    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith('booking-1');
      expect(mockConfirmPayment).toHaveBeenCalledWith({
        paymentKey: 'devmock_order-123',
        orderId: 'order-123',
        amount: 1_100_000,
      });
      expect(screen.getByText('Booking detail page')).toBeInTheDocument();
    });
  });

  it('surfaces payment errors to the user', async () => {
    const user = userEvent.setup();
    mockCreatePayment.mockRejectedValue(new Error('Unable to start checkout.'));

    mockedUseBookingDetail.mockReturnValue({
      data: createBookingDetail(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBookingDetail>);

    renderCheckoutPage();

    await user.click(screen.getByRole('button', { name: /simulate payment/i }));

    await waitFor(() => {
      expect(screen.getByText('Unable to start checkout.')).toBeInTheDocument();
    });
  });
});
