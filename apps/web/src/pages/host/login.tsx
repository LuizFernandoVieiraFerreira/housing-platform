import { Navigate } from 'react-router-dom';

import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { HostLoginPage } from '@/features/auth/pages/HostLoginPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function HostLogin() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/host" replace />;
  }

  return (
    <AuthLayout>
      <HostLoginPage />
    </AuthLayout>
  );
}
