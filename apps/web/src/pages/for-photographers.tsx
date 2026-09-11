import { PublicLayout } from '@/app/layouts/PublicLayout';
import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';

export default function ForPhotographers() {
  return (
    <PublicLayout>
      <ProfessionalPlatformPage platform="photographer" />
    </PublicLayout>
  );
}
