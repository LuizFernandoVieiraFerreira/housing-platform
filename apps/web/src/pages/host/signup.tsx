import { Navigate } from 'react-router-dom';

import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { HostSignUpPage } from '@/features/auth/pages/HostSignUpPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function HostSignUp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/host" replace />;
  }

  return (
    <AuthLayout>
      <HostSignUpPage />
    </AuthLayout>
  );
}
