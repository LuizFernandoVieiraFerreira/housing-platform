import type { PropertyCardProps } from '@housing-platform/ui';
import { PropertyCard } from '@housing-platform/ui';
import { useTranslation } from 'react-i18next';

import { useFormatPrice } from '@/i18n/CurrencyProvider';
import { usePropertyTypeLabel } from '@/i18n/hooks';

export function LocalizedPropertyCard(props: PropertyCardProps) {
  const { t } = useTranslation('common');
  const formatPrice = useFormatPrice();
  const propertyTypeLabel = usePropertyTypeLabel(props.propertyType);

  return (
    <PropertyCard
      {...props}
      propertyTypeLabel={propertyTypeLabel}
      monthlyPriceFormatted={formatPrice(props.monthlyPriceMin)}
      photoPlaceholderCompact={t('propertyCard.photoSoon')}
      photoPlaceholderDefault={t('propertyCard.photoComingSoon')}
      priceSuffix={t('propertyCard.perMonthSuffix')}
    />
  );
}
