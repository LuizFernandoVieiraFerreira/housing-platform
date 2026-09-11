import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isHostProfile } from '@/features/host/api/host-api';
import { useCurrentHost } from '@/features/host/hooks/useHost';

export function HostRoute() {
  const location = useLocation();
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);
  const {
    data: host,
    isLoading: isHostLoading,
    isError: isHostError,
    error: hostError,
    refetch: refetchHost,
  } = useCurrentHost();

  if (isLoading || isProfileLoading || isHostLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ink-muted text-sm">Loading host portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/host/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/signup/verify-email" replace state={{ email: user?.email ?? undefined }} />;
  }

  if (location.pathname === '/host/register') {
    return <Outlet />;
  }

  if (isHostError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-ink text-sm font-medium">Unable to load your host profile.</p>
        <p className="text-ink-muted text-sm">
          {hostError instanceof Error ? hostError.message : 'Please try again.'}
        </p>
        <button
          type="button"
          className="text-brand-600 text-sm font-medium hover:underline"
          onClick={() => void refetchHost()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isHostProfile(profile?.role) || !host) {
    return <Navigate to="/host/register" replace />;
  }

  return <Outlet />;
}
