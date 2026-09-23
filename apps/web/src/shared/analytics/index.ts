/**
 * Analytics module public API.
 *
 * Provides consent-aware analytics tracking with Amplitude.
 *
 * ## Usage
 *
 * ```ts
 * import { track, identify, analytics } from '@/shared/analytics';
 *
 * // Track an event (type-safe)
 * track({ name: 'booking_started', properties: { property_id: '123', room_id: '456', booking_mode: 'instant' } });
 *
 * // Identify user after login
 * identify(userId, { account_type: 'guest', locale: 'ko' });
 *
 * // Reset on logout
 * analytics.reset();
 * ```
 *
 * ## Consent
 *
 * Analytics only runs after user grants consent. The ConsentBanner component
 * handles the UX. Consent state is persisted to localStorage.
 *
 * ```ts
 * import { initAnalytics, isAnalyticsEnabled } from '@/shared/analytics';
 *
 * // Initialize at app startup (reads consent from localStorage)
 * initAnalytics();
 *
 * // Check if tracking is active
 * if (isAnalyticsEnabled()) { ... }
 * ```
 */

// Re-export types
export type {
  AnalyticsEvent,
  AnalyticsEventName,
  AuthEvent,
  AuthMethod,
  BookingEvent,
  EngagementEvent,
  HostEvent,
  SearchEvent,
  UserProperties,
} from './events';

// Re-export consent utilities
export {
  denyConsent,
  getConsent,
  grantConsent,
  isAnalyticsEnabled,
  onConsentChange,
  resetConsent,
  shouldShowConsentBanner,
  type ConsentState,
} from './consent';

import {
  getConsent,
  grantConsent as grantConsentState,
  denyConsent as denyConsentState,
  initConsent,
  isAnalyticsEnabled,
  onConsentChange,
} from './consent';
import {
  identifyUser,
  initAmplitude,
  isAmplitudeActive,
  resetUser,
  setUserProperties,
  shutdownAmplitude,
  trackEvent,
} from './amplitude';
import type { AnalyticsEvent, UserProperties } from './events';

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize analytics system.
 * Reads consent from localStorage and starts Amplitude if consent was previously granted.
 * Call once at app startup.
 */
export function initAnalytics(): void {
  const consent = initConsent();

  if (consent === 'granted') {
    initAmplitude();
  }

  // Listen for consent changes
  onConsentChange((state) => {
    if (state === 'granted') {
      initAmplitude();
    } else {
      shutdownAmplitude();
    }
  });
}

// ============================================================================
// Consent Actions (with side effects)
// ============================================================================

/**
 * Grant consent and initialize analytics.
 */
export function grantAnalyticsConsent(): void {
  grantConsentState();
  // Amplitude will be initialized via the consent change listener
}

/**
 * Deny consent and shutdown analytics.
 */
export function denyAnalyticsConsent(): void {
  denyConsentState();
  // Amplitude will be shutdown via the consent change listener
}

// ============================================================================
// Tracking API
// ============================================================================

/**
 * Track an analytics event.
 *
 * Type-safe: TypeScript enforces correct properties for each event name.
 * No-op if consent not granted or Amplitude not configured.
 *
 * @example
 * track({ name: 'booking_started', properties: { property_id: '123', room_id: '456', booking_mode: 'instant' } });
 */
export function track<E extends AnalyticsEvent>(event: E): void {
  if (!isAnalyticsEnabled()) {
    return;
  }
  trackEvent(event);
}

/**
 * Identify a user after login/signup.
 *
 * Call this after successful authentication to:
 * 1. Set the user ID for all future events
 * 2. Merge anonymous pre-login events with the user
 * 3. Set user properties for segmentation
 *
 * @example
 * identify(user.id, { account_type: 'guest', locale: 'ko', signup_date: '2026-09-01' });
 */
export function identify(userId: string, properties?: UserProperties): void {
  if (!isAnalyticsEnabled()) {
    return;
  }
  identifyUser(userId, properties);
}

/**
 * Update user properties without changing user ID.
 *
 * @example
 * setProperties({ locale: 'en' });
 */
export function setProperties(properties: UserProperties): void {
  if (!isAnalyticsEnabled()) {
    return;
  }
  setUserProperties(properties);
}

// ============================================================================
// Analytics Object (for less common operations)
// ============================================================================

/**
 * Analytics utilities for less common operations.
 */
export const analytics = {
  /**
   * Reset user identity on logout.
   * Clears user ID and generates new anonymous device ID.
   */
  reset: (): void => {
    if (!isAnalyticsEnabled()) {
      return;
    }
    resetUser();
  },

  /**
   * Check if analytics is currently active.
   */
  isActive: (): boolean => {
    return isAnalyticsEnabled() && isAmplitudeActive();
  },

  /**
   * Get current consent state.
   */
  getConsentState: getConsent,
};
