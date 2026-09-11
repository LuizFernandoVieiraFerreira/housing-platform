import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';

export default function AuthCallback() {
  return (
    <AuthLayout>
      <AuthCallbackPage />
    </AuthLayout>
  );
}
