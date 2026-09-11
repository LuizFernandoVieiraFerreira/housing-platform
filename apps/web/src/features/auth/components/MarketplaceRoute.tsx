import { Navigate, Outlet } from 'react-router-dom';

import { usePortalMode } from '@/app/providers/PortalModeProvider';
import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Guest marketplace pages (home, map, listings, customer bookings/checkout).
 * Admins stay in the admin console. Hosts may browse when portal mode is guest.
 */
export function MarketplaceRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile(user?.id);
  const { mode } = usePortalMode();

  if (isAuthenticated && (isLoading || isProfileLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ink-muted text-sm">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Hosts in host mode should not stay on marketplace pages.
  if (isAuthenticated && profile?.role === 'host' && mode === 'host') {
    return <Navigate to="/host" replace />;
  }

  return <Outlet />;
}
