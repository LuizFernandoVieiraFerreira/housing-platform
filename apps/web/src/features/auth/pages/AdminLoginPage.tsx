import { useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/auth/components/LoginForm';

export function AdminLoginPage() {
  const { t } = useTranslation('auth');

  return (
    <LoginForm
      defaultRedirectTo="/admin"
      title={t('adminLogin.title')}
      description={t('adminLogin.description')}
    />
  );
}
