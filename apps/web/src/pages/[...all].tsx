import { PublicLayout } from '@/app/layouts/PublicLayout';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';

export default function CatchAll() {
  return (
    <PublicLayout>
      <NotFoundPage />
    </PublicLayout>
  );
}
