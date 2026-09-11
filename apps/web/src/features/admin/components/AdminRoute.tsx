import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { isAdminProfile } from '@/features/admin/api/admin-api';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function AdminRoute() {
  const location = useLocation();
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ink-muted text-sm">Loading admin console...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isEmailVerified) {
    return (
      <Navigate to="/signup/verify-email" replace state={{ email: user?.email ?? undefined }} />
    );
  }

  if (!isAdminProfile(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
