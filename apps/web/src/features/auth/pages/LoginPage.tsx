import { useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <LoginForm
      defaultRedirectTo="/"
      title={t('login.title')}
      description={t('login.description')}
      alternateLoginPath="/host/login"
      alternateLoginPrompt={t('login.hostPrompt')}
      alternateLoginLinkLabel={t('login.hostLink')}
      signupPath="/signup"
      signupPrompt={t('login.newUser')}
      signupLinkLabel={t('login.createAccount')}
    />
  );
}
