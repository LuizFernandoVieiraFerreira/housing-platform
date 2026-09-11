import { Suspense, type ReactNode } from 'react';

import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';

interface LazyRouteProps {
  loadingFallback: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  children: ReactNode;
}

export function LazyRoute({
  loadingFallback,
  errorTitle,
  errorDescription,
  children,
}: LazyRouteProps) {
  return (
    <AppErrorBoundary title={errorTitle} description={errorDescription}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </AppErrorBoundary>
  );
}
