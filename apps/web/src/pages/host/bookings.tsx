import { lazy, Suspense } from 'react';

const HostBookingsPage = lazy(() =>
  import('@/features/host/pages/HostBookingsPage').then((m) => ({ default: m.HostBookingsPage })),
);

export default function HostBookings() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading bookings...</p>}>
      <HostBookingsPage />
    </Suspense>
  );
}
