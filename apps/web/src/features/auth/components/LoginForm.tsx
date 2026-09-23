import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormField, Input, PageHeader } from '@housing-platform/ui';
import { loginSchema, type LoginInput } from '@housing-platform/validation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { fetchCurrentProfile } from '@/features/account/api/profile-api';
import { getAuthErrorMessage, resolvePostLoginPath } from '@/features/auth/lib/auth-utils';
import { track } from '@/shared/analytics';
import { supabase } from '@/shared/api/supabase';

export interface LoginFormProps {
  /** Where to go after login when there is no safe returnTo query param. */
  defaultRedirectTo: string;
  title: string;
  description: string;
  /** When set, shows a link to create an account. Omit for admin login. */
  signupPath?: string;
  signupPrompt?: string;
  signupLinkLabel?: string;
  /** When set, shows a link to the other login entry point (guest vs host). */
  alternateLoginPath?: string;
  alternateLoginPrompt?: string;
  alternateLoginLinkLabel?: string;
}

export function LoginForm({
  defaultRedirectTo,
  title,
  description,
  signupPath,
  signupPrompt,
  signupLinkLabel,
  alternateLoginPath,
  alternateLoginPrompt,
  alternateLoginLinkLabel,
}: LoginFormProps) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      track({
        name: 'login_failed',
        properties: { method: 'email', error_code: error.code },
      });
      setFormError(getAuthErrorMessage(error, t('login.errorFallback')));
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!sessionData.session?.user.email_confirmed_at) {
      navigate('/signup/verify-email', {
        replace: true,
        state: { email: values.email },
      });
      return;
    }

    const profile = userId ? await fetchCurrentProfile(userId) : null;
    const destination = resolvePostLoginPath({
      returnToParam: searchParams.get('returnTo'),
      defaultRedirectTo,
      role: profile?.role,
    });

    navigate(destination, { replace: true });
  });

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate data-testid="login-form">
        <FormField label={t('login.email')} htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        <FormField
          label={t('login.password')}
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-brand-600 text-sm font-medium hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      {alternateLoginPath && alternateLoginPrompt && alternateLoginLinkLabel ? (
        <p className="text-ink-muted text-center text-sm">
          {alternateLoginPrompt}{' '}
          <Link to={alternateLoginPath} className="text-brand-600 font-medium hover:underline">
            {alternateLoginLinkLabel}
          </Link>
        </p>
      ) : null}

      {signupPath && signupPrompt && signupLinkLabel ? (
        <p className="text-ink-muted text-center text-sm">
          {signupPrompt}{' '}
          <Link to={signupPath} className="text-brand-600 font-medium hover:underline">
            {signupLinkLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
