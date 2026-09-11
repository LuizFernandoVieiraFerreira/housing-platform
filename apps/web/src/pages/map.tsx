import { MapLayout } from '@/app/layouts/MapLayout';
import { MarketplaceRoute } from '@/features/auth/components/MarketplaceRoute';
import { MapSearchPage } from '@/features/search/pages/MapSearchPage';

export default function MapPage() {
  return (
    <MapLayout>
      <MarketplaceRoute>
        <MapSearchPage />
      </MarketplaceRoute>
    </MapLayout>
  );
}
