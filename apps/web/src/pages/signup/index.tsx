import { Navigate } from 'react-router-dom';

import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function SignUp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <SignUpPage />
    </AuthLayout>
  );
}
