import { lazy, Suspense } from 'react';

const AdminHousingRequestsPage = lazy(() =>
  import('@/features/admin/pages/AdminHousingRequestsPage').then((m) => ({ default: m.AdminHousingRequestsPage })),
);

export default function AdminHousingRequests() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading housing requests...</p>}>
      <AdminHousingRequestsPage />
    </Suspense>
  );
}
