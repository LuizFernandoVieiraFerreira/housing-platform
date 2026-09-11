import type { AccommodationType } from '@housing-platform/types';

export const propertyTypeLabels: Record<AccommodationType, string> = {
  'share-house': 'Share-house',
  studio: 'Studio',
  'micro-studio': 'Micro Studio',
  'multi-bedroom': 'Multi-bedroom',
};

export function formatMonthlyPrice(amountKrw: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amountKrw);
}
