import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import {
  formatBookingDate,
  formatKrw,
  getBookingErrorMessage,
  getBookingStatusLabel,
} from '@/features/booking/lib/booking-utils';
import { useMyBookings } from '@/features/booking/hooks/useBooking';

export function BookingsPage() {
  const { data: bookings, isLoading, error } = useMyBookings();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading bookings...</p>;
  }

  if (error) {
    return (
      <Alert variant="error">
        {getBookingErrorMessage(error, 'Unable to load your bookings.')}
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <PageHeader
          title="Your bookings"
          description="Track booking requests, payment holds, and upcoming stays."
        />

        {!bookings?.length ? (
          <EmptyState
            className="mt-10"
            description="You have no bookings yet."
            action={
              <Link to="/map">
                <Button>Browse stays</Button>
              </Link>
            }
          />
        ) : (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="border-surface-subtle hover:bg-surface-muted/30 rounded-xl border p-5 transition-colors"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge variant="eyebrow">{getBookingStatusLabel(booking.status)}</Badge>
                    <h2 className="text-ink mt-1 text-lg font-semibold">{booking.propertyTitle}</h2>
                    <p className="text-ink-muted mt-1 text-sm">
                      {booking.roomName} · {booking.district}
                    </p>
                    <p className="text-ink-muted mt-2 text-sm">
                      {formatBookingDate(booking.checkIn)} – {formatBookingDate(booking.checkOut)} ·{' '}
                      {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
                    </p>
                    {booking.holdExpiresAt && booking.status === 'pending_payment' ? (
                      <p className="text-ink-muted mt-1 text-xs">
                        Hold expires {new Date(booking.holdExpiresAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="text-ink text-lg font-semibold">{formatKrw(booking.totalKrw)}</p>
                    <Link to={`/bookings/${booking.id}`}>
                      <Button variant="secondary" size="sm">
                        View details
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
