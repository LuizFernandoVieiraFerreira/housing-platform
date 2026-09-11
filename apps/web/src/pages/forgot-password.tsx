import { Navigate } from 'react-router-dom';

import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ForgotPassword() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <ForgotPasswordPage />
    </AuthLayout>
  );
}
