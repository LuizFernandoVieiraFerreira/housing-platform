import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from '@/i18n/config';
import { formatPrice as formatPriceValue } from '@/i18n/formatters';
import { getStoredCurrency } from '@/i18n/storage';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amountKrw: number, options?: { compact?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const currencyListeners = new Set<() => void>();
let currentCurrency = getStoredCurrency();

function notifyCurrencyListeners(): void {
  for (const listener of currencyListeners) {
    listener();
  }
}

function subscribeToCurrency(listener: () => void): () => void {
  currencyListeners.add(listener);
  return () => {
    currencyListeners.delete(listener);
  };
}

function getCurrencySnapshot(): CurrencyCode {
  return currentCurrency;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(
    subscribeToCurrency,
    getCurrencySnapshot,
    () => DEFAULT_CURRENCY,
  );

  const setCurrency = useCallback((next: CurrencyCode) => {
    if (next === currentCurrency) {
      return;
    }

    currentCurrency = next;
    localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    notifyCurrencyListeners();
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      formatPrice: (amountKrw, options) => formatPriceValue(amountKrw, currency, options),
    }),
    [currency, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return context;
}

export function useFormatPrice() {
  const { formatPrice } = useCurrency();
  return formatPrice;
}
