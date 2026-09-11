import { Alert, Card, EmptyState, PageHeader } from '@housing-platform/ui';

import { useAdminAuditLogs } from '@/features/admin/hooks/useAdmin';

export function AdminAuditLogsPage() {
  const { data: logs, isLoading, error } = useAdminAuditLogs();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading audit logs...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load audit logs.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Audit logs"
        description="Recent privileged actions performed by admins."
      />

      {!logs?.length ? (
        <EmptyState className="mt-10" description="No audit entries yet." />
      ) : (
        <div className="mt-8 space-y-4">
          {logs.map((log) => (
            <article key={log.id} className="border-surface-subtle rounded-xl border p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-ink font-medium">{log.action}</p>
                  <p className="text-ink-muted mt-1 text-sm">
                    {log.actorName} · {log.entityType}
                    {log.entityId ? ` · ${log.entityId}` : ''}
                  </p>
                </div>
                <p className="text-ink-muted text-sm">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
