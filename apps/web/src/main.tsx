import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import { AppProviders } from '@/app/providers/AppProviders';
import { initAnalytics } from '@/shared/analytics';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { initSentry, initWebVitalsMonitoring } from '@/shared/observability';

import './i18n';
import './index.css';

// Initialize observability and analytics
initSentry();
initWebVitalsMonitoring();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
