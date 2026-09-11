import { PublicLayout } from '@/app/layouts/PublicLayout';
import { LegalPage } from '@/shared/pages/LegalPage';

export default function Terms() {
  return (
    <PublicLayout>
      <LegalPage page="terms" />
    </PublicLayout>
  );
}
