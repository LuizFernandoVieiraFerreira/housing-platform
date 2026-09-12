import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentSuccessPage } from '@/features/checkout/pages/PaymentSuccessPage';
import { renderWithProviders } from '@/test/render';

const mockConfirmPayment = vi.fn();

vi.mock('@/features/checkout/hooks/usePayment', () => ({
  useConfirmPayment: vi.fn(() => ({
    mutateAsync: mockConfirmPayment,
  })),
}));

function renderPaymentSuccessPage(search = '?paymentKey=pay-1&orderId=order-1&amount=500000') {
  return renderWithProviders(
    <Routes>
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/bookings/:bookingId" element={<p>Booking detail page</p>} />
      <Route path="/bookings" element={<p>Bookings list</p>} />
    </Routes>,
    { initialEntries: [`/payment/success${search}`] },
  );
}

describe('PaymentSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmPayment.mockResolvedValue({ bookingId: 'booking-42', status: 'confirmed' });
  });

  it('shows error when redirect URL is missing payment params', async () => {
    renderPaymentSuccessPage('');

    await waitFor(() => {
      expect(
        screen.getByText('Payment details are missing from the redirect URL.'),
      ).toBeInTheDocument();
    });

    expect(mockConfirmPayment).not.toHaveBeenCalled();
  });

  it('confirms payment once and shows success with booking link', async () => {
    renderPaymentSuccessPage();

    await waitFor(() => {
      expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view booking/i })).toHaveAttribute(
        'href',
        '/bookings/booking-42',
      );
    });

    expect(mockConfirmPayment).toHaveBeenCalledTimes(1);
    expect(mockConfirmPayment).toHaveBeenCalledWith({
      paymentKey: 'pay-1',
      orderId: 'order-1',
      amount: 500_000,
    });
  });

  it('shows error when payment confirmation fails', async () => {
    mockConfirmPayment.mockRejectedValue(new Error('Amount mismatch.'));

    renderPaymentSuccessPage();

    await waitFor(() => {
      expect(screen.getByText('Amount mismatch.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to bookings/i })).toBeInTheDocument();
    });
  });
});
