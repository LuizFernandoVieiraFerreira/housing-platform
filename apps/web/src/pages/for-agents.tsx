import { PublicLayout } from '@/app/layouts/PublicLayout';
import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';

export default function ForAgents() {
  return (
    <PublicLayout>
      <ProfessionalPlatformPage platform="agent" />
    </PublicLayout>
  );
}
