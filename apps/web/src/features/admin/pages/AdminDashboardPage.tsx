import { Button, Card, PageHeader } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { useAdminDashboardStats } from '@/features/admin/hooks/useAdmin';

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminDashboardStats();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading dashboard...</p>;
  }

  if (error || !stats) {
    return <p className="text-ink-muted text-sm">Unable to load admin dashboard.</p>;
  }

  return (
    <Card>
      <PageHeader
        title="Operations dashboard"
        description="Review pending listings, hosts, bookings, and housing leads."
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Properties pending review</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{stats.pendingProperties}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Hosts pending approval</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{stats.pendingHosts}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Open bookings</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{stats.openBookings}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Open housing requests</dt>
          <dd className="text-ink mt-1 text-2xl font-semibold">{stats.openHousingRequests}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/properties">
          <Button>Review properties</Button>
        </Link>
        <Link to="/admin/bookings">
          <Button variant="secondary">Manage bookings</Button>
        </Link>
        <Link to="/admin/housing-requests">
          <Button variant="secondary">Housing requests</Button>
        </Link>
      </div>
    </Card>
  );
}
