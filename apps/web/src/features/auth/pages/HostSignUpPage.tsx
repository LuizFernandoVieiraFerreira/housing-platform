import { useTranslation } from 'react-i18next';

import { SignUpForm } from '@/features/auth/components/SignUpForm';

export function HostSignUpPage() {
  const { t } = useTranslation('auth');

  return (
    <SignUpForm
      title={t('hostSignup.title')}
      description={t('hostSignup.description')}
      successRedirectTo="/host/register"
      loginPath="/host/login"
    />
  );
}
