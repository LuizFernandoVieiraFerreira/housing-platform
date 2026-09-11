import { useTranslation } from 'react-i18next';

import { SignUpForm } from '@/features/auth/components/SignUpForm';

export function SignUpPage() {
  const { t } = useTranslation('auth');

  return (
    <SignUpForm
      title={t('signup.title')}
      description={t('signup.description')}
      successRedirectTo="/account/profile"
      loginPath="/login"
    />
  );
}
