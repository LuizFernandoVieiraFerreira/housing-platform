import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  denyConsent,
  getConsent,
  grantConsent,
  initConsent,
  isAnalyticsEnabled,
  onConsentChange,
  resetConsent,
  shouldShowConsentBanner,
} from './consent';

describe('consent management', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConsent();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initConsent', () => {
    it('returns unknown when no consent stored', () => {
      const result = initConsent();

      expect(result).toBe('unknown');
      expect(getConsent()).toBe('unknown');
    });

    it('returns granted when consent was previously granted', () => {
      localStorage.setItem('analytics_consent', 'granted');

      const result = initConsent();

      expect(result).toBe('granted');
      expect(getConsent()).toBe('granted');
    });

    it('returns denied when consent was previously denied', () => {
      localStorage.setItem('analytics_consent', 'denied');

      const result = initConsent();

      expect(result).toBe('denied');
      expect(getConsent()).toBe('denied');
    });
  });

  describe('grantConsent', () => {
    it('sets consent to granted', () => {
      grantConsent();

      expect(getConsent()).toBe('granted');
      expect(localStorage.getItem('analytics_consent')).toBe('granted');
    });

    it('persists timestamp', () => {
      grantConsent();

      const timestamp = localStorage.getItem('analytics_consent_at');
      expect(timestamp).toBeTruthy();
      expect(() => new Date(timestamp!)).not.toThrow();
    });
  });

  describe('denyConsent', () => {
    it('sets consent to denied', () => {
      denyConsent();

      expect(getConsent()).toBe('denied');
      expect(localStorage.getItem('analytics_consent')).toBe('denied');
    });
  });

  describe('isAnalyticsEnabled', () => {
    it('returns false when consent is unknown', () => {
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it('returns true when consent is granted', () => {
      grantConsent();

      expect(isAnalyticsEnabled()).toBe(true);
    });

    it('returns false when consent is denied', () => {
      denyConsent();

      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe('shouldShowConsentBanner', () => {
    it('returns true when consent is unknown', () => {
      expect(shouldShowConsentBanner()).toBe(true);
    });

    it('returns false when consent is granted', () => {
      grantConsent();

      expect(shouldShowConsentBanner()).toBe(false);
    });

    it('returns false when consent is denied', () => {
      denyConsent();

      expect(shouldShowConsentBanner()).toBe(false);
    });
  });

  describe('onConsentChange', () => {
    it('notifies listeners when consent changes', () => {
      const listener = vi.fn();
      onConsentChange(listener);

      grantConsent();

      expect(listener).toHaveBeenCalledWith('granted');
    });

    it('allows unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = onConsentChange(listener);

      unsubscribe();
      grantConsent();

      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      onConsentChange(listener1);
      onConsentChange(listener2);

      denyConsent();

      expect(listener1).toHaveBeenCalledWith('denied');
      expect(listener2).toHaveBeenCalledWith('denied');
    });
  });

  describe('resetConsent', () => {
    it('clears consent state', () => {
      grantConsent();
      resetConsent();

      expect(getConsent()).toBe('unknown');
      expect(localStorage.getItem('analytics_consent')).toBeNull();
    });
  });
});
