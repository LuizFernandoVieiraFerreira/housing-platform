import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@housing-platform/ui';
import { Check, Globe } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CURRENCY_LABELS,
  LANGUAGE_LABELS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  type CurrencyCode,
  type LanguageCode,
} from '@/i18n/config';
import { useCurrency } from '@/i18n/CurrencyProvider';
import { useLanguage } from '@/i18n/hooks';

function LocaleMenuItem({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="flex items-center justify-between gap-3">
      <span className={selected ? 'text-brand-600 font-semibold' : undefined}>{label}</span>
      {selected ? <Check size={14} className="text-brand-600 shrink-0" aria-hidden /> : null}
    </DropdownMenuItem>
  );
}

export function LocaleSwitcher() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const handleLanguageSelect = useCallback(
    async (next: LanguageCode) => {
      if (next === language) {
        return;
      }

      await setLanguage(next);
      await queryClient.invalidateQueries();
    },
    [language, queryClient, setLanguage],
  );

  const handleCurrencySelect = useCallback(
    (next: CurrencyCode) => {
      if (next === currency) {
        return;
      }

      setCurrency(next);
    },
    [currency, setCurrency],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-ink-muted gap-1.5 px-2 text-xs font-semibold"
          aria-label={t('header.localeSettings')}
        >
          <Globe size={16} aria-hidden />
          {CURRENCY_LABELS[currency]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="text-ink-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
          {t('header.languageSection')}
        </DropdownMenuLabel>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <LocaleMenuItem
            key={lang}
            label={LANGUAGE_LABELS[lang]}
            selected={lang === language}
            onSelect={() => {
              void handleLanguageSelect(lang);
            }}
          />
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-ink-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
          {t('header.currencySection')}
        </DropdownMenuLabel>
        {SUPPORTED_CURRENCIES.map((code) => (
          <LocaleMenuItem
            key={code}
            label={CURRENCY_LABELS[code]}
            selected={code === currency}
            onSelect={() => {
              handleCurrencySelect(code);
            }}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
