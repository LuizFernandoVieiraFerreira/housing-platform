import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormField, Input, PageHeader } from '@housing-platform/ui';
import { resetPasswordSchema, type ResetPasswordInput } from '@housing-platform/validation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { supabase } from '@/shared/api/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsReady(Boolean(session));
    });
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to update password.'));
      return;
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Password updated. You can log in with your new password.' },
    });
  });

  if (!isReady) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          This reset link is invalid or has expired. Request a new password reset email.
        </Alert>
        <Link to="/forgot-password" className="text-brand-600 text-sm font-medium hover:underline">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Choose a new password"
        description="Enter a new password for your account."
      />

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField
          label="New password"
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
          label="Confirm new password"
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
