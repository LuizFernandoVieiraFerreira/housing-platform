import { PublicLayout } from '@/app/layouts/PublicLayout';
import { LegalPage } from '@/shared/pages/LegalPage';

export default function Privacy() {
  return (
    <PublicLayout>
      <LegalPage page="privacy" />
    </PublicLayout>
  );
}
