import { lazy, Suspense } from 'react';

const HostDashboardPage = lazy(() =>
  import('@/features/host/pages/HostDashboardPage').then((m) => ({ default: m.HostDashboardPage })),
);

export default function HostDashboard() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading dashboard...</p>}>
      <HostDashboardPage />
    </Suspense>
  );
}
