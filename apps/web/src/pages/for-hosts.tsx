import { PublicLayout } from '@/app/layouts/PublicLayout';
import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';

export default function ForHosts() {
  return (
    <PublicLayout>
      <ProfessionalPlatformPage platform="host" />
    </PublicLayout>
  );
}
