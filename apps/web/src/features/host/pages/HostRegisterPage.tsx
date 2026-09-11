import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, FormField, Input, PageHeader } from '@housing-platform/ui';
import { hostRegisterSchema, type HostRegisterInput } from '@housing-platform/validation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { useCurrentHost, useRegisterHost } from '@/features/host/hooks/useHost';

export function HostRegisterPage() {
  const navigate = useNavigate();
  const { data: host, isLoading: isHostLoading } = useCurrentHost();
  const registerHost = useRegisterHost();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HostRegisterInput>({
    resolver: zodResolver(hostRegisterSchema),
    defaultValues: {
      displayName: '',
    },
  });

  useEffect(() => {
    if (host) {
      navigate('/host', { replace: true });
    }
  }, [host, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await registerHost.mutateAsync(values.displayName);
      navigate('/host');
    } catch (mutationError) {
      setError(getAuthErrorMessage(mutationError, 'Unable to register as a host.'));
    }
  });

  if (isHostLoading) {
    return <p className="text-ink-muted px-4 py-16 text-sm">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <PageHeader
          title="Become a host"
          description="Create your host profile to list monthly stays. Listings are reviewed by the platform before they go live."
        />

        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          <FormField label="Host display name" htmlFor="displayName" error={errors.displayName?.message}>
            <Input id="displayName" hasError={Boolean(errors.displayName)} {...register('displayName')} />
          </FormField>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <Button type="submit" disabled={isSubmitting || registerHost.isPending}>
            {isSubmitting || registerHost.isPending ? 'Creating profile...' : 'Create host profile'}
          </Button>
        </form>

        <Link to="/account" className="text-brand-600 mt-6 inline-block text-sm font-medium hover:underline">
          Back to account
        </Link>
      </Card>
    </div>
  );
}
