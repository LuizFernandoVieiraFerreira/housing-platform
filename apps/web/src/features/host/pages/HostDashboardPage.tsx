import { Card, PageHeader } from '@housing-platform/ui';

import { useCurrentHost, useHostProperties } from '@/features/host/hooks/useHost';

export function HostDashboardPage() {
  const { data: host } = useCurrentHost();
  const { data: properties } = useHostProperties();

  const draftCount = properties?.filter((property) => property.status === 'draft').length ?? 0;
  const pendingCount =
    properties?.filter((property) => property.status === 'pending_review').length ?? 0;
  const publishedCount =
    properties?.filter((property) => property.status === 'published').length ?? 0;

  return (
    <Card>
      <PageHeader
        title="Host dashboard"
        description={`Welcome back, ${host?.display_name}. Manage listings, rooms, and booking requests from here.`}
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Draft listings</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{draftCount}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Pending review</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{pendingCount}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Published</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{publishedCount}</dd>
        </div>
      </dl>
    </Card>
  );
}
