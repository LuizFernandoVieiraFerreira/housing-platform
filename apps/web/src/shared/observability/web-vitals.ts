import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

import { logger } from '@/shared/lib/logger';

import { isSentryEnabled } from './sentry';

const log = logger.child('WebVitals');

export type CoreWebVitalName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

export interface CoreWebVitalReport {
  name: CoreWebVitalName;
  value: number;
  rating: Metric['rating'];
  navigationType: Metric['navigationType'];
  id: string;
}

function reportCoreWebVital(metric: Metric): void {
  const report: CoreWebVitalReport = {
    name: metric.name as CoreWebVitalName,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    id: metric.id,
  };

  log.info('Core Web Vital recorded', {
    action: 'report',
    data: { ...report },
  });
}

/**
 * Logs Core Web Vitals locally when Sentry is not configured.
 * When Sentry is enabled, `webVitalsIntegration()` handles production reporting.
 */
export function initWebVitalsMonitoring(): void {
  if (isSentryEnabled()) {
    return;
  }

  onCLS(reportCoreWebVital);
  onFCP(reportCoreWebVital);
  onINP(reportCoreWebVital);
  onLCP(reportCoreWebVital);
  onTTFB(reportCoreWebVital);
}

export { reportCoreWebVital };
