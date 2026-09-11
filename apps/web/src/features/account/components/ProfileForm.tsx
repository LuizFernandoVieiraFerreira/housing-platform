import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@housing-platform/ui';
import { profileUpdateSchema, type ProfileUpdateInput } from '@housing-platform/validation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCurrentProfile, useUpdateProfileMutation } from '@/features/account/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { fromProfileLanguage } from '@/i18n/config';
import { useLanguage } from '@/i18n/hooks';

const languageOptions = [
  { value: 'en', labelKey: 'profile.languages.en' as const },
  { value: 'ko', labelKey: 'profile.languages.ko' as const },
];

export function ProfileForm() {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useCurrentProfile(user?.id);
  const updateProfile = useUpdateProfileMutation(user?.id);
  const { setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      preferredLanguage: 'en',
      marketingConsent: false,
      avatarUrl: '',
    },
  });

  const preferredLanguage = watch('preferredLanguage');

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      fullName: profile.full_name,
      phone: profile.phone ?? '',
      preferredLanguage: profile.preferred_language,
      marketingConsent: profile.marketing_consent,
      avatarUrl: profile.avatar_url ?? '',
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    try {
      await updateProfile.mutateAsync({
        full_name: values.fullName,
        phone: values.phone || null,
        avatar_url: values.avatarUrl || null,
        preferred_language: values.preferredLanguage,
        marketing_consent: values.marketingConsent,
      });

      const nextLanguage = fromProfileLanguage(values.preferredLanguage);
      await setLanguage(nextLanguage);
      await queryClient.invalidateQueries();

      setSuccessMessage(t('profile.success'));
    } catch (mutationError) {
      setSuccessMessage(null);
      throw mutationError;
    }
  });

  if (isLoading) {
    return <p className="text-ink-muted text-sm">{t('profile.loading')}</p>;
  }

  if (error) {
    return (
      <Alert variant="error">{getAuthErrorMessage(error, t('profile.loadError'))}</Alert>
    );
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {updateProfile.error ? (
        <Alert variant="error">
          {getAuthErrorMessage(updateProfile.error, t('profile.updateError'))}
        </Alert>
      ) : null}

      <FormField label={t('profile.fullName')} htmlFor="fullName" error={errors.fullName?.message} required>
        <Input
          id="fullName"
          autoComplete="name"
          hasError={Boolean(errors.fullName)}
          {...register('fullName')}
        />
      </FormField>

      <FormField label={t('profile.phone')} htmlFor="phone" error={errors.phone?.message}>
        <Input
          id="phone"
          autoComplete="tel"
          hasError={Boolean(errors.phone)}
          {...register('phone')}
        />
      </FormField>

      <FormField
        label={t('profile.preferredLanguage')}
        htmlFor="preferredLanguage"
        error={errors.preferredLanguage?.message}
        required
      >
        <Select
          value={preferredLanguage}
          onValueChange={(value) => {
            setValue('preferredLanguage', value, { shouldDirty: true });
          }}
        >
          <SelectTrigger id="preferredLanguage" hasError={Boolean(errors.preferredLanguage)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t('profile.avatarUrl')} htmlFor="avatarUrl" error={errors.avatarUrl?.message}>
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://"
          hasError={Boolean(errors.avatarUrl)}
          {...register('avatarUrl')}
        />
      </FormField>

      <label className="text-ink-muted flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="border-surface-subtle mt-1 rounded"
          {...register('marketingConsent')}
        />
        <span>{t('profile.marketingConsent')}</span>
      </label>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? t('profile.saving') : t('profile.save')}
      </Button>
    </form>
  );
}
