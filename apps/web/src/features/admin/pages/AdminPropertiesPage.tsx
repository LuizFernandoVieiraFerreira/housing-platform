import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { useState } from 'react';

import {
  useAdminProperties,
  usePublishAdminProperty,
  useRejectAdminProperty,
} from '@/features/admin/hooks/useAdmin';

export function AdminPropertiesPage() {
  const { data: properties, isLoading, error } = useAdminProperties();
  const publishProperty = usePublishAdminProperty();
  const rejectProperty = useRejectAdminProperty();
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingProperties =
    properties?.filter((property) => property.status === 'pending_review') ?? [];

  const handlePublish = async (propertyId: string) => {
    setActionError(null);

    try {
      await publishProperty.mutateAsync(propertyId);
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error ? mutationError.message : 'Unable to publish property.',
      );
    }
  };

  const handleReject = async (propertyId: string) => {
    setActionError(null);

    try {
      await rejectProperty.mutateAsync(propertyId);
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error ? mutationError.message : 'Unable to reject property.',
      );
    }
  };

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading properties...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load properties.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Property reviews"
        description="Publish approved listings or send drafts back to hosts for edits."
      />

      {actionError ? (
        <Alert variant="error" className="mt-6">
          {actionError}
        </Alert>
      ) : null}

      {!pendingProperties.length ? (
        <EmptyState className="mt-10" description="No properties are waiting for review." />
      ) : (
        <div className="mt-8 space-y-4">
          {pendingProperties.map((property) => (
            <article key={property.id} className="border-surface-subtle rounded-xl border p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge variant="eyebrow">Pending review</Badge>
                  <h2 className="text-ink mt-1 text-lg font-semibold">{property.title}</h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    {property.hostDisplayName} · {property.district} · {property.roomCount} room
                    {property.roomCount === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handlePublish(property.id)}
                    disabled={publishProperty.isPending}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleReject(property.id)}
                    disabled={rejectProperty.isPending}
                  >
                    Send back to draft
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
