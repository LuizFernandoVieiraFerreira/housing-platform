/**
 * Amplitude SDK wrapper.
 *
 * Handles initialization, event tracking, and user identification.
 * Only active when consent is granted and API key is configured.
 */

import * as amplitude from '@amplitude/analytics-browser';

import { logger } from '@/shared/lib/logger';

import type { AnalyticsEvent, UserProperties } from './events';

const log = logger.child('analytics');

let isInitialized = false;

// ============================================================================
// Configuration
// ============================================================================

function getApiKey(): string | undefined {
  return import.meta.env.VITE_AMPLITUDE_API_KEY?.trim();
}

function isAmplitudeConfigured(): boolean {
  return Boolean(getApiKey());
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize Amplitude SDK.
 * Only call after consent is granted.
 */
export function initAmplitude(): void {
  if (isInitialized) {
    log.debug('Amplitude already initialized', { action: 'initAmplitude' });
    return;
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    log.info('Amplitude API key not configured, analytics disabled', {
      action: 'initAmplitude',
    });
    return;
  }

  amplitude.init(apiKey, {
    // Disable automatic tracking - we track manually for control
    defaultTracking: false,
    // Minimum user ID length
    minIdLength: 1,
    // Log level for debugging
    logLevel:
      import.meta.env.DEV && import.meta.env.VITE_AMPLITUDE_DEBUG === 'true'
        ? amplitude.Types.LogLevel.Debug
        : amplitude.Types.LogLevel.None,
  });

  isInitialized = true;
  log.info('Amplitude initialized', { action: 'initAmplitude' });
}

/**
 * Shutdown Amplitude (on consent revoke).
 */
export function shutdownAmplitude(): void {
  if (!isInitialized) return;

  amplitude.reset();
  isInitialized = false;
  log.info('Amplitude shutdown', { action: 'shutdownAmplitude' });
}

// ============================================================================
// Tracking
// ============================================================================

/**
 * Track an analytics event.
 * No-op if not initialized or not configured.
 */
export function trackEvent<E extends AnalyticsEvent>(event: E): void {
  if (!isInitialized || !isAmplitudeConfigured()) {
    log.debug('Event not tracked (analytics disabled)', {
      action: 'trackEvent',
      data: { event: event.name },
    });
    return;
  }

  amplitude.track(event.name, event.properties);

  log.debug('Event tracked', {
    action: 'trackEvent',
    data: { event: event.name, properties: event.properties },
  });
}

// ============================================================================
// User Identity
// ============================================================================

/**
 * Identify a user after login/signup.
 * Merges anonymous device history with user ID.
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  if (!isInitialized || !isAmplitudeConfigured()) {
    log.debug('User not identified (analytics disabled)', {
      action: 'identifyUser',
      data: { userId },
    });
    return;
  }

  amplitude.setUserId(userId);

  if (properties) {
    const identifyEvent = new amplitude.Identify();

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        identifyEvent.set(key, value);
      }
    });

    amplitude.identify(identifyEvent);
  }

  log.debug('User identified', {
    action: 'identifyUser',
    data: { userId, properties },
  });
}

/**
 * Update user properties without changing user ID.
 */
export function setUserProperties(properties: UserProperties): void {
  if (!isInitialized || !isAmplitudeConfigured()) {
    return;
  }

  const identifyEvent = new amplitude.Identify();

  Object.entries(properties).forEach(([key, value]) => {
    if (value !== undefined) {
      identifyEvent.set(key, value);
    }
  });

  amplitude.identify(identifyEvent);

  log.debug('User properties updated', {
    action: 'setUserProperties',
    data: { properties },
  });
}

/**
 * Reset user identity (on logout).
 * Clears user ID and generates new device ID.
 */
export function resetUser(): void {
  if (!isInitialized || !isAmplitudeConfigured()) {
    return;
  }

  amplitude.reset();
  log.debug('User reset', { action: 'resetUser' });
}

/**
 * Check if Amplitude is currently active.
 */
export function isAmplitudeActive(): boolean {
  return isInitialized && isAmplitudeConfigured();
}
