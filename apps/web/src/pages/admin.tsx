import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { useCurrentProfile } from '@/features/account';
import { isAdminProfile, AdminLayout } from '@/features/admin';
import { useAuth } from '@/features/auth';

/**
 * Layout wrapper for /admin/* routes.
 * Handles admin authentication and renders nested routes via Outlet.
 */
export default function AdminLayoutPage() {
  const location = useLocation();
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);

  const loading = isLoading || isProfileLoading;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-ink-muted text-sm">Loading admin console...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/signup/verify-email" replace state={{ email: user?.email }} />;
  }

  if (!isAdminProfile(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <PublicLayout>
      <AppErrorBoundary
        title="Unable to load admin console"
        description="Something went wrong while loading the admin console. Try again or return home."
      >
        <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading admin console...</p>}>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </Suspense>
      </AppErrorBoundary>
    </PublicLayout>
  );
}
