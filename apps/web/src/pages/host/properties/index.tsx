import { lazy, Suspense } from 'react';

const HostPropertiesPage = lazy(() =>
  import('@/features/host/pages/HostPropertiesPage').then((m) => ({ default: m.HostPropertiesPage })),
);

export default function HostProperties() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading properties...</p>}>
      <HostPropertiesPage />
    </Suspense>
  );
}
