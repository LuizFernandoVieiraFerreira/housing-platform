import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormField, Input, PageHeader } from '@housing-platform/ui';
import { signUpSchema, type SignUpInput } from '@housing-platform/validation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { supabase } from '@/shared/api/supabase';

const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

export interface SignUpFormProps {
  title: string;
  description: string;
  /** Where to go when signup returns an immediate session. */
  successRedirectTo: string;
  loginPath: string;
}

export function SignUpForm({ title, description, successRedirectTo, loginPath }: SignUpFormProps) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      marketingConsent: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          marketing_consent: values.marketingConsent,
        },
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      setFormError(getAuthErrorMessage(error, t('signup.errorFallback')));
      return;
    }

    if (data.session) {
      navigate(successRedirectTo, { replace: true });
      return;
    }

    setSuccessMessage(t('signup.successMessage'));
    navigate('/signup/verify-email', {
      replace: true,
      state: { email: values.email },
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {formError ? <Alert variant="error">{formError}</Alert> : null}
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField
          label={t('signup.fullName')}
          htmlFor="fullName"
          error={errors.fullName?.message}
          required
        >
          <Input
            id="fullName"
            autoComplete="name"
            hasError={Boolean(errors.fullName)}
            {...register('fullName')}
          />
        </FormField>

        <FormField label={t('signup.email')} htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        <FormField
          label={t('signup.password')}
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        <FormField
          label={t('signup.confirmPassword')}
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
        </FormField>

        <label className="text-ink-muted flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="border-surface-subtle mt-1 rounded"
            {...register('marketingConsent')}
          />
          <span>{t('signup.marketingConsent')}</span>
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('signup.submitting') : t('signup.submit')}
        </Button>
      </form>

      <p className="text-ink-muted text-center text-sm">
        {t('signup.existingUser')}{' '}
        <Link to={loginPath} className="text-brand-600 font-medium hover:underline">
          {t('signup.logIn')}
        </Link>
      </p>
    </div>
  );
}
