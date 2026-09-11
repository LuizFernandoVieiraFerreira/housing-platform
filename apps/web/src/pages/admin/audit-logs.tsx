import { lazy, Suspense } from 'react';

const AdminAuditLogsPage = lazy(() =>
  import('@/features/admin/pages/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })),
);

export default function AdminAuditLogs() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading audit logs...</p>}>
      <AdminAuditLogsPage />
    </Suspense>
  );
}
