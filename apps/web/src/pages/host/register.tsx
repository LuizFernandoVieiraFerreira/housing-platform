import { lazy, Suspense } from 'react';

const HostRegisterPage = lazy(() =>
  import('@/features/host/pages/HostRegisterPage').then((m) => ({ default: m.HostRegisterPage })),
);

export default function HostRegister() {
  return (
    <Suspense fallback={<p className="text-ink-muted px-4 py-16 text-sm">Loading...</p>}>
      <HostRegisterPage />
    </Suspense>
  );
}
