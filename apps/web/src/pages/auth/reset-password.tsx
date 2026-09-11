import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

export default function ResetPassword() {
  return (
    <AuthLayout>
      <ResetPasswordPage />
    </AuthLayout>
  );
}
