import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { useCurrentProfile } from '@/features/account';
import { useAuth } from '@/features/auth';
import { useCurrentHost, isHostProfile, HostLayout } from '@/features/host';

/**
 * Layout wrapper for /host/* routes.
 * Handles host authentication and renders nested routes via Outlet.
 */
export default function HostLayoutPage() {
  const location = useLocation();
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);
  const { data: host, isLoading: isHostLoading } = useCurrentHost();

  const loading = isLoading || isProfileLoading || isHostLoading;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-ink-muted text-sm">Loading host portal...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/host/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/signup/verify-email" replace state={{ email: user?.email }} />;
  }

  // If user is authenticated but not a host, redirect to registration
  if (!isHostProfile(profile?.role) || !host) {
    if (location.pathname !== '/host/register') {
      return <Navigate to="/host/register" replace />;
    }
  }

  return (
    <PublicLayout>
      <AppErrorBoundary
        title="Unable to load host portal"
        description="Something went wrong while loading the host portal. Try again or return home."
      >
        <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading host portal...</p>}>
          <HostLayout>
            <Outlet />
          </HostLayout>
        </Suspense>
      </AppErrorBoundary>
    </PublicLayout>
  );
}
