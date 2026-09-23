import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Amplitude before importing analytics
vi.mock('@amplitude/analytics-browser', () => ({
  init: vi.fn(),
  track: vi.fn(),
  setUserId: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  Identify: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
  })),
  Types: {
    LogLevel: {
      Debug: 1,
      None: 0,
    },
  },
}));

import * as amplitude from '@amplitude/analytics-browser';

import {
  analytics,
  denyAnalyticsConsent,
  grantAnalyticsConsent,
  identify,
  initAnalytics,
  isAnalyticsEnabled,
  track,
} from './index';
import { resetConsent } from './consent';

describe('analytics module', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConsent();
    vi.clearAllMocks();
    // Set API key for tests
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', 'test-api-key');
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  describe('initAnalytics', () => {
    it('does not initialize Amplitude when consent is unknown', () => {
      initAnalytics();

      expect(amplitude.init).not.toHaveBeenCalled();
    });

    it('initializes Amplitude when consent was previously granted', () => {
      localStorage.setItem('analytics_consent', 'granted');

      initAnalytics();

      expect(amplitude.init).toHaveBeenCalledWith('test-api-key', expect.any(Object));
    });
  });

  describe('grantAnalyticsConsent', () => {
    it('initializes Amplitude when consent is granted', () => {
      initAnalytics(); // Set up consent listener
      grantAnalyticsConsent();

      expect(amplitude.init).toHaveBeenCalled();
      expect(isAnalyticsEnabled()).toBe(true);
    });
  });

  describe('denyAnalyticsConsent', () => {
    it('shuts down Amplitude when consent is denied', () => {
      localStorage.setItem('analytics_consent', 'granted');
      initAnalytics();
      vi.clearAllMocks();

      denyAnalyticsConsent();

      expect(amplitude.reset).toHaveBeenCalled();
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe('track', () => {
    it('does not track when consent is not granted', () => {
      initAnalytics();

      track({ name: 'login_completed', properties: { method: 'email' } });

      expect(amplitude.track).not.toHaveBeenCalled();
    });

    it('tracks event when consent is granted', () => {
      localStorage.setItem('analytics_consent', 'granted');
      initAnalytics();

      track({ name: 'login_completed', properties: { method: 'email' } });

      expect(amplitude.track).toHaveBeenCalledWith('login_completed', { method: 'email' });
    });
  });

  describe('identify', () => {
    it('does not identify when consent is not granted', () => {
      initAnalytics();

      identify('user-123', { account_type: 'guest' });

      expect(amplitude.setUserId).not.toHaveBeenCalled();
    });

    it('identifies user when consent is granted', () => {
      localStorage.setItem('analytics_consent', 'granted');
      initAnalytics();

      identify('user-123', { account_type: 'guest' });

      expect(amplitude.setUserId).toHaveBeenCalledWith('user-123');
      expect(amplitude.identify).toHaveBeenCalled();
    });
  });

  describe('analytics.reset', () => {
    it('resets user identity when consent is granted', () => {
      localStorage.setItem('analytics_consent', 'granted');
      initAnalytics();

      analytics.reset();

      expect(amplitude.reset).toHaveBeenCalled();
    });
  });

  describe('analytics.isActive', () => {
    it('returns false when consent is not granted', () => {
      initAnalytics();

      expect(analytics.isActive()).toBe(false);
    });

    it('returns true when consent is granted and API key is set', () => {
      localStorage.setItem('analytics_consent', 'granted');
      initAnalytics();

      expect(analytics.isActive()).toBe(true);
    });
  });
});
