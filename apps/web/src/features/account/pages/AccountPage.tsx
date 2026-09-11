import { Button, Card, PageHeader } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function AccountPage() {
  const { user, isEmailVerified } = useAuth();
  const { data: profile, isLoading } = useCurrentProfile(user?.id);

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading account...</p>;
  }

  return (
    <Card>
      <PageHeader
        title="Account overview"
        description="Manage your profile and upcoming bookings from here."
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Full name</dt>
          <dd className="text-ink mt-1 font-medium">{profile?.full_name ?? '—'}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Email</dt>
          <dd className="text-ink mt-1 font-medium">{user?.email ?? '—'}</dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Email status</dt>
          <dd className="text-ink mt-1 font-medium">
            {isEmailVerified ? 'Verified' : 'Verification required'}
          </dd>
        </div>
        <div className="border-surface-subtle rounded-lg border p-4">
          <dt className="text-ink-muted text-sm">Role</dt>
          <dd className="text-ink mt-1 font-medium capitalize">{profile?.role ?? 'customer'}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/account/profile" className="inline-flex">
          <Button>Edit profile</Button>
        </Link>
        <Link to="/bookings" className="inline-flex">
          <Button variant="secondary">View bookings</Button>
        </Link>
      </div>
    </Card>
  );
}
