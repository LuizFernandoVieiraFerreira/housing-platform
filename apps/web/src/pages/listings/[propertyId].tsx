import { PublicLayout } from '@/app/layouts/PublicLayout';
import { MarketplaceRoute } from '@/features/auth/components/MarketplaceRoute';
import { PropertyDetailPage } from '@/features/listings/pages/PropertyDetailPage';

export default function PropertyDetail() {
  return (
    <PublicLayout>
      <MarketplaceRoute>
        <PropertyDetailPage />
      </MarketplaceRoute>
    </PublicLayout>
  );
}
