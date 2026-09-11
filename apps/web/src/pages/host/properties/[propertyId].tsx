import { lazy, Suspense } from 'react';

const HostPropertyFormPage = lazy(() =>
  import('@/features/host/pages/HostPropertyFormPage').then((m) => ({ default: m.HostPropertyFormPage })),
);

export default function HostPropertyEdit() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading property...</p>}>
      <HostPropertyFormPage />
    </Suspense>
  );
}
