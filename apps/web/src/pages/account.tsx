import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AccountLayout } from '@/features/account/layouts/AccountLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Layout wrapper for /account/* routes.
 * Handles authentication and renders nested routes via Outlet.
 */
export default function AccountLayoutPage() {
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-ink-muted text-sm">Loading your account...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/signup/verify-email" replace state={{ email: user?.email }} />;
  }

  return (
    <PublicLayout>
      <AccountLayout>
        <Outlet />
      </AccountLayout>
    </PublicLayout>
  );
}
