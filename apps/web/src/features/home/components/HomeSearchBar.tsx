import { Button, Input } from '@housing-platform/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { buildAiSearchParams, SEOUL_CENTER } from '@/features/search/lib/search-params';

interface HomeSearchFormValues {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}

export function HomeSearchBar() {
  const { t } = useTranslation('search');
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<HomeSearchFormValues>({
    defaultValues: {
      query: '',
      checkIn: '',
      checkOut: '',
      guests: '1',
    },
  });

  const onSubmit = handleSubmit((values) => {
    const params = buildAiSearchParams({
      aiQuery: values.query.trim() || undefined,
      filters: {
        checkIn: values.checkIn || undefined,
        checkOut: values.checkOut || undefined,
        guests: Number(values.guests) || 1,
        sort: 'recommended',
        ...SEOUL_CENTER,
      },
    });

    navigate({ pathname: '/map', search: params.toString() });
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          type="text"
          placeholder={t('home.search.placeholder')}
          aria-label={t('home.search.queryLabel')}
          {...register('query')}
        />
        <div className="grid gap-3 sm:grid-cols-2 md:col-span-1 md:grid-cols-2">
          <Input type="date" aria-label={t('home.search.checkIn')} {...register('checkIn')} />
          <Input type="date" aria-label={t('home.search.checkOut')} {...register('checkOut')} />
        </div>
        <Input
          type="number"
          min={1}
          aria-label={t('home.search.guests')}
          className="md:w-24"
          {...register('guests')}
        />
        <Button type="submit" size="lg" className="w-full md:w-auto">
          {t('home.search.submit')}
        </Button>
      </div>
    </form>
  );
}
