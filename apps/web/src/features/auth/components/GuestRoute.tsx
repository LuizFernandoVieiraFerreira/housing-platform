import { Navigate, Outlet } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { getAuthenticatedHomePath } from '@/features/auth/lib/auth-utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function GuestRoute({ defaultRedirect = '/' }: { defaultRedirect?: string }) {
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);

  if (isLoading || (isAuthenticated && isEmailVerified && isProfileLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ink-muted text-sm">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && isEmailVerified) {
    return (
      <Navigate to={getAuthenticatedHomePath(profile?.role, defaultRedirect)} replace />
    );
  }

  return <Outlet />;
}
