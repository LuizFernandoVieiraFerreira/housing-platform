import type { ReactNode } from 'react';

import { Sentry } from '@/shared/observability/sentry';
import { RouteErrorFallback } from '@/shared/components/RouteErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AppErrorBoundary({ children, title, description }: AppErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <RouteErrorFallback title={title} description={description} onRetry={resetError} />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
