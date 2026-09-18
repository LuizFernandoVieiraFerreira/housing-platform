import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onCLS, onFCP, onINP, onLCP, onTTFB, infoMock, childMock } = vi.hoisted(() => {
  const infoMock = vi.fn();
  const childMock = vi.fn(() => ({ info: infoMock }));

  return {
    onCLS: vi.fn(),
    onFCP: vi.fn(),
    onINP: vi.fn(),
    onLCP: vi.fn(),
    onTTFB: vi.fn(),
    infoMock,
    childMock,
  };
});

vi.mock('web-vitals', () => ({
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
}));

vi.mock('./sentry', () => ({
  isSentryEnabled: vi.fn(() => false),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    child: childMock,
  },
}));

import type { Metric } from 'web-vitals';

import { initWebVitalsMonitoring, reportCoreWebVital } from './web-vitals';

describe('web-vitals monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers Core Web Vitals observers when Sentry is disabled', () => {
    initWebVitalsMonitoring();

    expect(onCLS).toHaveBeenCalledOnce();
    expect(onFCP).toHaveBeenCalledOnce();
    expect(onINP).toHaveBeenCalledOnce();
    expect(onLCP).toHaveBeenCalledOnce();
    expect(onTTFB).toHaveBeenCalledOnce();
  });

  it('logs structured metric payloads', () => {
    reportCoreWebVital({
      name: 'LCP',
      value: 1800,
      rating: 'good',
      navigationType: 'navigate',
      navigationId: 1,
      id: 'vital-1',
      delta: 1800,
      entries: [],
    } satisfies Metric);

    expect(infoMock).toHaveBeenCalledWith('Core Web Vital recorded', {
      action: 'report',
      data: {
        name: 'LCP',
        value: 1800,
        rating: 'good',
        navigationType: 'navigate',
        id: 'vital-1',
      },
    });
  });
});
