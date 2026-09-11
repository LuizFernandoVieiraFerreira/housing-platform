import { Alert } from '@housing-platform/ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getSafeReturnTo } from '@/features/auth/lib/auth-utils';
import { supabase } from '@/shared/api/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeAuth = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const authError =
        hashParams.get('error_description') ?? searchParams.get('error_description');

      if (authError) {
        if (isMounted) {
          setError(authError);
        }
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        if (isMounted) {
          setError(sessionError.message);
        }
        return;
      }

      if (!data.session) {
        if (isMounted) {
          setError('Unable to complete sign in. Try logging in again.');
        }
        return;
      }

      const returnTo = getSafeReturnTo(searchParams.get('returnTo'));
      navigate(returnTo, { replace: true });
    };

    void completeAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error}</Alert>
        <Link to="/login" className="text-brand-600 text-sm font-medium hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return <p className="text-ink-muted text-sm">Completing sign in...</p>;
}
