import { lazy, Suspense } from 'react';

const AdminPaymentsPage = lazy(() =>
  import('@/features/admin/pages/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })),
);

export default function AdminPayments() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading payments...</p>}>
      <AdminPaymentsPage />
    </Suspense>
  );
}
