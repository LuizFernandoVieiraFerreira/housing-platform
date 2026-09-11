import { Navigate, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { MessagesPage } from '@/features/support/pages/MessagesPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function Messages() {
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-ink-muted text-sm">Loading...</p>
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
      <MessagesPage />
    </PublicLayout>
  );
}
