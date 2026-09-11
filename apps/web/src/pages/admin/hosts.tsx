import { lazy, Suspense } from 'react';

const AdminHostsPage = lazy(() =>
  import('@/features/admin/pages/AdminHostsPage').then((m) => ({ default: m.AdminHostsPage })),
);

export default function AdminHosts() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading hosts...</p>}>
      <AdminHostsPage />
    </Suspense>
  );
}
