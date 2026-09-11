import { useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/auth/components/LoginForm';

export function HostLoginPage() {
  const { t } = useTranslation('auth');

  return (
    <LoginForm
      defaultRedirectTo="/host"
      title={t('hostLogin.title')}
      description={t('hostLogin.description')}
      alternateLoginPath="/login"
      alternateLoginPrompt={t('hostLogin.guestPrompt')}
      alternateLoginLinkLabel={t('hostLogin.guestLink')}
      signupPath="/host/signup"
      signupPrompt={t('hostLogin.newUser')}
      signupLinkLabel={t('hostLogin.createAccount')}
    />
  );
}
