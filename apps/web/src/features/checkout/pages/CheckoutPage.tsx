import { Alert, Button, Card, PageHeader } from '@housing-platform/ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useBookingDetail } from '@/features/booking/hooks/useBooking';
import { formatKrw, getBookingErrorMessage } from '@/features/booking/lib/booking-utils';
import {
  createDevMockPaymentKey,
  getTossClientKey,
  getTossFailUrl,
  getTossSuccessUrl,
  isPaymentDevMockEnabled,
} from '@/features/checkout/api/payment-api';
import { useConfirmPayment, useCreatePaymentOrder } from '@/features/checkout/hooks/usePayment';

export function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useBookingDetail(bookingId);
  const createPayment = useCreatePaymentOrder();
  const confirmPayment = useConfirmPayment();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isLaunchingPayment, setIsLaunchingPayment] = useState(false);

  useEffect(() => {
    if (!booking || booking.status !== 'pending_payment') {
      return;
    }

    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() <= Date.now()) {
      setCheckoutError('This booking hold has expired. Start a new booking to continue.');
    }
  }, [booking]);

  const handlePay = async () => {
    if (!bookingId || !booking) {
      return;
    }

    setCheckoutError(null);
    setIsLaunchingPayment(true);

    try {
      const order = await createPayment.mutateAsync(bookingId);

      if (isPaymentDevMockEnabled()) {
        await confirmPayment.mutateAsync({
          paymentKey: createDevMockPaymentKey(order.orderId),
          orderId: order.orderId,
          amount: order.amountKrw,
        });
        navigate(`/bookings/${bookingId}`);
        return;
      }

      const clientKey = getTossClientKey();

      if (!clientKey) {
        throw new Error('Toss client key is not configured.');
      }

      const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: order.amountKrw,
        },
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: getTossSuccessUrl(),
        failUrl: getTossFailUrl(),
      });
    } catch (paymentError) {
      setCheckoutError(getBookingErrorMessage(paymentError, 'Unable to start payment.'));
    } finally {
      setIsLaunchingPayment(false);
    }
  };

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading checkout...</p>;
  }

  if (error) {
    return (
      <Alert variant="error">{getBookingErrorMessage(error, 'Unable to load checkout.')}</Alert>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="text-center">
          <PageHeader title="Booking not found" />
          <Link to="/bookings" className="mt-4 inline-flex">
            <Button variant="secondary">Back to bookings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (booking.status !== 'pending_payment' && booking.status !== 'payment_failed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="text-center">
          <Alert variant="info">This booking is not ready for payment.</Alert>
          <Link to={`/bookings/${booking.id}`} className="mt-4 inline-flex">
            <Button variant="secondary">View booking</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <PageHeader
          eyebrow="Checkout"
          title={booking.propertyTitle}
          description={`${booking.roomName} · ${booking.district}`}
        />

        <div className="border-surface-subtle mt-8 space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Rent</span>
            <span className="text-ink">{formatKrw(booking.rentKrw)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Service fee</span>
            <span className="text-ink">{formatKrw(booking.serviceFeeKrw)}</span>
          </div>
          <div className="border-surface-subtle flex justify-between border-t pt-2 font-semibold">
            <span className="text-ink">Total due</span>
            <span className="text-ink">{formatKrw(booking.totalKrw)}</span>
          </div>
        </div>

        {booking.holdExpiresAt ? (
          <Alert variant="info" className="mt-6">
            Complete payment before {new Date(booking.holdExpiresAt).toLocaleString()}.
          </Alert>
        ) : null}

        {isPaymentDevMockEnabled() ? (
          <Alert variant="info" className="mt-6">
            Toss client key is not configured. Local dev will simulate a successful payment.
          </Alert>
        ) : null}

        {checkoutError ? (
          <Alert variant="error" className="mt-6">
            {checkoutError}
          </Alert>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => void handlePay()}
            disabled={isLaunchingPayment || createPayment.isPending || confirmPayment.isPending}
          >
            {isLaunchingPayment || createPayment.isPending || confirmPayment.isPending
              ? 'Processing...'
              : isPaymentDevMockEnabled()
                ? 'Simulate payment'
                : 'Pay with Toss'}
          </Button>
          <Link to={`/bookings/${booking.id}`}>
            <Button variant="secondary" size="lg">
              Back
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
