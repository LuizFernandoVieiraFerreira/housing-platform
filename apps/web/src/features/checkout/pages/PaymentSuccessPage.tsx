import { Alert, Button } from '@housing-platform/ui';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getBookingErrorMessage } from '@/features/booking/lib/booking-utils';
import { useConfirmPayment } from '@/features/checkout/hooks/usePayment';
import { track } from '@/shared/analytics';

type ConfirmStatus = 'confirming' | 'success' | 'error';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { mutateAsync: confirmPaymentMutation } = useConfirmPayment();
  const [status, setStatus] = useState<ConfirmStatus>('confirming');
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const hasConfirmedRef = useRef(false);

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const amount = Number(searchParams.get('amount') ?? 0);

  useEffect(() => {
    if (hasConfirmedRef.current) {
      return;
    }

    if (!paymentKey || !orderId || !amount) {
      setError('Payment details are missing from the redirect URL.');
      setStatus('error');
      return;
    }

    hasConfirmedRef.current = true;

    void confirmPaymentMutation({ paymentKey, orderId, amount })
      .then((result) => {
        if (result.bookingId) {
          setBookingId(result.bookingId);

          track({
            name: 'payment_completed',
            properties: {
              booking_id: result.bookingId,
              total_price_krw: amount,
              payment_method: 'card',
            },
          });
        }

        setStatus('success');
      })
      .catch((confirmError) => {
        track({
          name: 'payment_failed',
          properties: {
            booking_id: orderId.split('_')[1] ?? orderId, // Extract booking ID from order ID if possible
            error_code: confirmError instanceof Error ? confirmError.message : undefined,
          },
        });
        setError(getBookingErrorMessage(confirmError, 'Unable to confirm payment.'));
        setStatus('error');
      });
  }, [amount, confirmPaymentMutation, orderId, paymentKey]);

  if (status === 'confirming') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-ink-muted text-sm">Confirming your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert variant="error">{error}</Alert>
        <Link to="/bookings" className="mt-6 inline-flex">
          <Button variant="secondary">Back to bookings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Alert variant="success">Payment confirmed. Your booking is confirmed.</Alert>
      {bookingId ? (
        <Link to={`/bookings/${bookingId}`} className="mt-6 inline-flex">
          <Button>View booking</Button>
        </Link>
      ) : (
        <Link to="/bookings" className="mt-6 inline-flex">
          <Button>View bookings</Button>
        </Link>
      )}
    </div>
  );
}
