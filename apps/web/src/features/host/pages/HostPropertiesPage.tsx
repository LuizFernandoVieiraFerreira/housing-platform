import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { useHostProperties } from '@/features/host/hooks/useHost';

const statusLabels = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Published',
  archived: 'Archived',
} as const;

export function HostPropertiesPage() {
  const { data: properties, isLoading, error } = useHostProperties();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading properties...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load your properties.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Your properties"
        description="Create drafts, add rooms, and submit listings for review."
        actions={
          <Link to="/host/properties/new">
            <Button>New listing</Button>
          </Link>
        }
      />

      {!properties?.length ? (
        <EmptyState
          className="mt-10"
          description="You have not created any listings yet."
          action={
            <Link to="/host/properties/new">
              <Button>Create your first listing</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {properties.map((property) => (
            <article
              key={property.id}
              className="border-surface-subtle flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Badge variant="eyebrow">{statusLabels[property.status]}</Badge>
                <h2 className="text-ink mt-1 text-lg font-semibold">{property.title}</h2>
                <p className="text-ink-muted mt-1 text-sm">
                  {property.district} · {property.roomCount} room
                  {property.roomCount === 1 ? '' : 's'} ·{' '}
                  {property.bookingMode === 'instant' ? 'Instant book' : 'Request to book'}
                </p>
              </div>
              <Link to={`/host/properties/${property.id}`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
