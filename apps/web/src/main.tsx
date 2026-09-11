import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/providers/AppProviders';
import { AppRouter } from '@/app/router';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { initSentry } from '@/shared/observability/sentry';

import './i18n';
import './index.css';

initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
