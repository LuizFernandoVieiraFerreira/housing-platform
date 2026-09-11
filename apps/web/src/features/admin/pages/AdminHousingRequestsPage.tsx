import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { useState } from 'react';
import type { HousingRequestStatus } from '@housing-platform/types';

import { formatKrw } from '@/features/booking/lib/booking-utils';
import {
  useAdminHousingRequests,
  useUpdateAdminHousingRequestStatus,
} from '@/features/admin/hooks/useAdmin';

function getHousingRequestStatusLabel(status: HousingRequestStatus): string {
  return status.replace('_', ' ');
}

export function AdminHousingRequestsPage() {
  const { data: requests, isLoading, error } = useAdminHousingRequests();
  const updateStatus = useUpdateAdminHousingRequestStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (requestId: string, status: HousingRequestStatus) => {
    setActionError(null);

    try {
      await updateStatus.mutateAsync({ requestId, status });
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error ? mutationError.message : 'Unable to update housing request.',
      );
    }
  };

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading housing requests...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load housing requests.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Housing requests"
        description="Follow up on leads submitted from the marketplace."
      />

      {actionError ? (
        <Alert variant="error" className="mt-6">
          {actionError}
        </Alert>
      ) : null}

      {!requests?.length ? (
        <EmptyState className="mt-10" description="No housing requests yet." />
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="border-surface-subtle rounded-xl border p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge variant="eyebrow">{getHousingRequestStatusLabel(request.status)}</Badge>
                  <h2 className="text-ink mt-1 text-lg font-semibold">{request.desiredArea}</h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    {request.email}
                    {request.accommodationType ? ` · ${request.accommodationType}` : ''}
                    {request.budgetMax ? ` · up to ${formatKrw(request.budgetMax)}` : ''}
                  </p>
                  {request.notes ? <p className="text-ink-muted mt-2 text-sm">{request.notes}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {request.status !== 'in_progress' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleStatusChange(request.id, 'in_progress')}
                      disabled={updateStatus.isPending}
                    >
                      Mark in progress
                    </Button>
                  ) : null}
                  {request.status !== 'closed' ? (
                    <Button
                      size="sm"
                      onClick={() => void handleStatusChange(request.id, 'closed')}
                      disabled={updateStatus.isPending}
                    >
                      Close
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
