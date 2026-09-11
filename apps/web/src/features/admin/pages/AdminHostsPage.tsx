import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { useState } from 'react';

import { useAdminHosts, useApproveAdminHost } from '@/features/admin/hooks/useAdmin';

export function AdminHostsPage() {
  const { data: hosts, isLoading, error } = useAdminHosts();
  const approveHost = useApproveAdminHost();
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingHosts = hosts?.filter((host) => host.status === 'pending') ?? [];

  const handleApprove = async (hostId: string) => {
    setActionError(null);

    try {
      await approveHost.mutateAsync(hostId);
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error ? mutationError.message : 'Unable to approve host.',
      );
    }
  };

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading hosts...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load hosts.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Host approvals"
        description="Activate new host accounts before they manage listings."
      />

      {actionError ? (
        <Alert variant="error" className="mt-6">
          {actionError}
        </Alert>
      ) : null}

      {!pendingHosts.length ? (
        <EmptyState className="mt-10" description="No hosts are waiting for approval." />
      ) : (
        <div className="mt-8 space-y-4">
          {pendingHosts.map((host) => (
            <article key={host.id} className="border-surface-subtle rounded-xl border p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge variant="eyebrow">Pending host</Badge>
                  <h2 className="text-ink mt-1 text-lg font-semibold">{host.displayName}</h2>
                  <p className="text-ink-muted mt-1 text-sm">Profile: {host.profileName}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => void handleApprove(host.id)}
                  disabled={approveHost.isPending}
                >
                  Approve host
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
