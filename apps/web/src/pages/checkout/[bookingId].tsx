import { Suspense, lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { useAuth } from '@/features/auth/hooks/useAuth';

const CheckoutPage = lazy(() =>
  import('@/features/checkout/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);

export default function Checkout() {
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <PublicLayout>
        <p className="text-ink-muted px-4 py-16 text-sm">Loading checkout...</p>
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
      <AppErrorBoundary
        title="Unable to load checkout"
        description="Something went wrong while loading checkout. Try again or return to your bookings."
      >
        <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading checkout...</p>}>
          <CheckoutPage />
        </Suspense>
      </AppErrorBoundary>
    </PublicLayout>
  );
}
