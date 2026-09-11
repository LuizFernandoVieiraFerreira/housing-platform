import { lazy, Suspense } from 'react';

const AdminBookingsPage = lazy(() =>
  import('@/features/admin/pages/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage })),
);

export default function AdminBookings() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading bookings...</p>}>
      <AdminBookingsPage />
    </Suspense>
  );
}
