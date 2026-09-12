import { Button, Input } from '@housing-platform/ui';
import { Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { buildAiSearchParams, SEOUL_CENTER } from '@/features/search/lib/search-params';
import { searchBarContainer } from '@/shared/lib/variants';

interface HomeSearchFormValues {
  query: string;
}

export function HomeSearchBar() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<HomeSearchFormValues>({
    defaultValues: { query: '' },
  });

  // Dates, guests and price live in the filter modal on /map, where there are
  // listings to react to. The hero only needs to capture the initial intent.
  const onSubmit = handleSubmit((values) => {
    const params = buildAiSearchParams({
      aiQuery: values.query.trim() || undefined,
      filters: {
        sort: 'recommended',
        ...SEOUL_CENTER,
      },
    });

    navigate({ pathname: '/map', search: params.toString() });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-[560px]">
      <div className={searchBarContainer()}>
        <Search className="text-ink-subtle h-5 w-5 shrink-0" aria-hidden="true" />
        <Input
          type="text"
          placeholder={t('search.placeholder')}
          aria-label={t('search.queryLabel')}
          className="flex-1 rounded-none border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          {...register('query')}
        />
        <Button type="submit" className="shrink-0 rounded-full px-6">
          {t('search.submit')}
        </Button>
      </div>
    </form>
  );
}
