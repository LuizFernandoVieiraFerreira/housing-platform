import { Alert, Button, Card, PageHeader } from '@housing-platform/ui';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import {
  canCancelBooking,
  canPayBooking,
  formatBookingDate,
  formatKrw,
  getBookingErrorMessage,
  getBookingStatusLabel,
  isHoldExpired,
} from '@/features/booking/lib/booking-utils';
import { useBookingDetail, useCancelBooking } from '@/features/booking/hooks/useBooking';

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: booking, isLoading, error } = useBookingDetail(bookingId);
  const cancelBooking = useCancelBooking();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-ink-muted text-sm">Loading booking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Alert variant="error">
          {getBookingErrorMessage(error, 'Unable to load this booking.')}
        </Alert>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="text-center">
          <PageHeader title="Booking not found" />
          <Link to="/bookings" className="mt-4 inline-flex">
            <Button variant="secondary">Back to bookings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleCancel = async () => {
    setCancelError(null);

    try {
      await cancelBooking.mutateAsync(booking.id);
      setCancelled(true);
    } catch (mutationError) {
      setCancelError(getBookingErrorMessage(mutationError, 'Unable to cancel booking.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <Link to="/bookings" className="text-brand-600 text-sm font-medium hover:underline">
          ← Back to bookings
        </Link>

        <PageHeader
          className="mt-4 items-start sm:items-start"
          eyebrow={getBookingStatusLabel(booking.status)}
          title={booking.propertyTitle}
          description={`${booking.roomName} · ${booking.district}`}
          actions={<p className="text-ink text-2xl font-bold">{formatKrw(booking.totalKrw)}</p>}
        />

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border-surface-subtle rounded-lg border p-4">
            <dt className="text-ink-muted text-sm">Check-in</dt>
            <dd className="text-ink mt-1 font-medium">{formatBookingDate(booking.checkIn)}</dd>
          </div>
          <div className="border-surface-subtle rounded-lg border p-4">
            <dt className="text-ink-muted text-sm">Check-out</dt>
            <dd className="text-ink mt-1 font-medium">{formatBookingDate(booking.checkOut)}</dd>
          </div>
          <div className="border-surface-subtle rounded-lg border p-4">
            <dt className="text-ink-muted text-sm">Guests</dt>
            <dd className="text-ink mt-1 font-medium">{booking.guestCount}</dd>
          </div>
          <div className="border-surface-subtle rounded-lg border p-4">
            <dt className="text-ink-muted text-sm">Booking type</dt>
            <dd className="text-ink mt-1 font-medium capitalize">{booking.bookingType}</dd>
          </div>
        </dl>

        <div className="border-surface-subtle mt-8 space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Rent</span>
            <span className="text-ink">{formatKrw(booking.rentKrw)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Service fee ({booking.serviceFeePercent}%)</span>
            <span className="text-ink">{formatKrw(booking.serviceFeeKrw)}</span>
          </div>
          <div className="border-surface-subtle flex justify-between border-t pt-2 font-semibold">
            <span className="text-ink">Total</span>
            <span className="text-ink">{formatKrw(booking.totalKrw)}</span>
          </div>
        </div>

        {booking.customerNotes ? (
          <div className="mt-6">
            <h2 className="text-ink text-sm font-semibold">Notes for the host</h2>
            <p className="text-ink-muted mt-2 text-sm">{booking.customerNotes}</p>
          </div>
        ) : null}

        {booking.holdExpiresAt && booking.status === 'pending_payment' ? (
          <Alert variant="info" className="mt-6">
            {isHoldExpired(booking.holdExpiresAt)
              ? 'Your payment hold has expired.'
              : `Complete payment before ${new Date(booking.holdExpiresAt).toLocaleString()}.`}
          </Alert>
        ) : null}

        {booking.status === 'requested' ? (
          <Alert variant="info" className="mt-6">
            The host will review your request. You can pay here after approval.
          </Alert>
        ) : null}

        {booking.status === 'payment_failed' ? (
          <Alert variant="error" className="mt-6">
            Your last payment attempt failed. You can retry once from checkout.
          </Alert>
        ) : null}

        {cancelled ? (
          <Alert variant="success" className="mt-6">
            Booking cancelled.
          </Alert>
        ) : null}

        {cancelError ? (
          <Alert variant="error" className="mt-6">
            {cancelError}
          </Alert>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {canPayBooking(booking.status) &&
          !(booking.holdExpiresAt && isHoldExpired(booking.holdExpiresAt)) ? (
            <Link to={`/checkout/${booking.id}`}>
              <Button>{booking.status === 'payment_failed' ? 'Retry payment' : 'Pay now'}</Button>
            </Link>
          ) : null}

          <Link to={`/listings/${booking.propertyId}`}>
            <Button variant="secondary">View listing</Button>
          </Link>

          {canCancelBooking(booking.status) && !cancelled ? (
            <Button
              variant="secondary"
              onClick={() => void handleCancel()}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Cancel booking'}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
