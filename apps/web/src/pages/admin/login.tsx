import { Navigate } from 'react-router-dom';

import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function AdminLogin() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AuthLayout>
      <AdminLoginPage />
    </AuthLayout>
  );
}
