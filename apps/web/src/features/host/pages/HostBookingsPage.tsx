import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { useState } from 'react';

import {
  formatBookingDate,
  formatKrw,
  getBookingErrorMessage,
  getBookingStatusLabel,
} from '@/features/booking/lib/booking-utils';
import {
  useApproveHostBooking,
  useHostBookings,
  useRejectHostBooking,
} from '@/features/host/hooks/useHost';

export function HostBookingsPage() {
  const { data: bookings, isLoading, error } = useHostBookings();
  const approveBooking = useApproveHostBooking();
  const rejectBooking = useRejectHostBooking();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async (bookingId: string) => {
    setActionError(null);

    try {
      await approveBooking.mutateAsync(bookingId);
    } catch (mutationError) {
      setActionError(getBookingErrorMessage(mutationError, 'Unable to approve booking.'));
    }
  };

  const handleReject = async (bookingId: string) => {
    setActionError(null);

    try {
      await rejectBooking.mutateAsync(bookingId);
    } catch (mutationError) {
      setActionError(getBookingErrorMessage(mutationError, 'Unable to reject booking.'));
    }
  };

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading bookings...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load host bookings.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Booking requests"
        description="Review request-to-book stays and approve guests before they pay."
      />

      {actionError ? (
        <Alert variant="error" className="mt-6">
          {actionError}
        </Alert>
      ) : null}

      {!bookings?.length ? (
        <EmptyState className="mt-10" description="No bookings yet." />
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="border-surface-subtle rounded-xl border p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge variant="eyebrow">{getBookingStatusLabel(booking.status)}</Badge>
                  <h2 className="text-ink mt-1 text-lg font-semibold">{booking.propertyTitle}</h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    {booking.roomName} · {formatBookingDate(booking.checkIn)} –{' '}
                    {formatBookingDate(booking.checkOut)} · {booking.guestCount} guest
                    {booking.guestCount === 1 ? '' : 's'}
                  </p>
                  {booking.customerNotes ? (
                    <p className="text-ink-muted mt-2 text-sm">Notes: {booking.customerNotes}</p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <p className="text-ink text-lg font-semibold">{formatKrw(booking.totalKrw)}</p>
                  {booking.status === 'requested' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleApprove(booking.id)}
                        disabled={approveBooking.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleReject(booking.id)}
                        disabled={rejectBooking.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
