import { lazy, Suspense } from 'react';

const HostPropertyFormPage = lazy(() =>
  import('@/features/host/pages/HostPropertyFormPage').then((m) => ({ default: m.HostPropertyFormPage })),
);

export default function HostPropertyNew() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading form...</p>}>
      <HostPropertyFormPage />
    </Suspense>
  );
}
