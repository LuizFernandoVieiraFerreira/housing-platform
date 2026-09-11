import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormField, Input, PageHeader } from '@housing-platform/ui';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@housing-platform/validation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { supabase } from '@/shared/api/supabase';

const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to send reset email.'));
      return;
    }

    setSuccessMessage('If an account exists for that email, a reset link has been sent.');
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reset password"
        description="Enter your email and we'll send a link to choose a new password."
      />

      {formError ? <Alert variant="error">{formError}</Alert> : null}
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-ink-muted text-center text-sm">
        Remembered your password?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
