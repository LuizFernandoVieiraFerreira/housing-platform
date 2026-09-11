import { lazy, Suspense } from 'react';

const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);

export default function AdminDashboard() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading dashboard...</p>}>
      <AdminDashboardPage />
    </Suspense>
  );
}
