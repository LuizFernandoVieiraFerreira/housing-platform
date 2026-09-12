import type { ReactNode } from 'react';

import { Sentry } from '@/shared/observability/sentry';
import { RouteErrorFallback } from '@/shared/components/RouteErrorFallback';
import { logger } from '@/shared/lib/logger';

const log = logger.child('ErrorBoundary');

interface AppErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AppErrorBoundary({ children, title, description }: AppErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      onError={(error, componentStack) => {
        log.error('React error boundary caught error', {
          action: 'errorBoundary',
          error,
          data: {
            componentStack,
            url: window.location.href,
          },
        });
      }}
      fallback={({ resetError }) => (
        <RouteErrorFallback title={title} description={description} onRetry={resetError} />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
