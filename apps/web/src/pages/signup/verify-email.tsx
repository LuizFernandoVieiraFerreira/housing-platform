import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';

export default function VerifyEmail() {
  return (
    <AuthLayout>
      <VerifyEmailPage />
    </AuthLayout>
  );
}
