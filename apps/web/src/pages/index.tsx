import { PublicLayout } from '@/app/layouts/PublicLayout';
import { MarketplaceRoute } from '@/features/auth/components/MarketplaceRoute';
import { HomePage } from '@/features/home/pages/HomePage';

export default function Home() {
  return (
    <PublicLayout>
      <MarketplaceRoute>
        <HomePage />
      </MarketplaceRoute>
    </PublicLayout>
  );
}
