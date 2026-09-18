import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

function getTracePropagationTargets(): (string | RegExp)[] {
  const targets: (string | RegExp)[] = ['localhost', /^\//];

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

  if (supabaseUrl) {
    try {
      targets.push(new URL(supabaseUrl).host);
    } catch {
      // Ignore invalid Supabase URL in local env files.
    }
  }

  return targets;
}

export function isSentryEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());
}

export function initSentry(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.reactRouterBrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
        enableInp: true,
        enableLongTask: true,
      }),
      Sentry.webVitalsIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1,
    tracePropagationTargets: getTracePropagationTargets(),
  });
}

export { Sentry };
