import { lazy, Suspense } from 'react';

const AdminPropertiesPage = lazy(() =>
  import('@/features/admin/pages/AdminPropertiesPage').then((m) => ({ default: m.AdminPropertiesPage })),
);

export default function AdminProperties() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading properties...</p>}>
      <AdminPropertiesPage />
    </Suspense>
  );
}
