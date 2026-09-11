import { Alert, Button, PageHeader } from '@housing-platform/ui';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { supabase } from '@/shared/api/supabase';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isEmailVerified } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const email =
    (location.state as { email?: string } | null)?.email ?? user?.email ?? 'your email address';

  useEffect(() => {
    if (isEmailVerified) {
      navigate('/account', { replace: true });
    }
  }, [isEmailVerified, navigate]);

  const handleResend = async () => {
    if (!email || email === 'your email address') {
      setError('Sign up again to request a new verification email.');
      return;
    }

    setIsResending(true);
    setError(null);
    setMessage(null);

    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    setIsResending(false);

    if (resendError) {
      setError(getAuthErrorMessage(resendError, 'Unable to resend verification email.'));
      return;
    }

    setMessage('Verification email sent. Check your inbox and spam folder.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verify your email"
        description={
          <>
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Confirm
            your email to access your account.
          </>
        }
      />

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Alert variant="info">
        Local development emails appear in Mailpit at{' '}
        <a href="http://127.0.0.1:54324" className="text-brand-600 font-medium hover:underline">
          http://127.0.0.1:54324
        </a>
        .
      </Alert>

      <Button type="button" className="w-full" onClick={handleResend} disabled={isResending}>
        {isResending ? 'Sending...' : 'Resend verification email'}
      </Button>

      <p className="text-ink-muted text-center text-sm">
        Already verified?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
