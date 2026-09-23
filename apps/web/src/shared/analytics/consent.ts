/**
 * Analytics consent management.
 *
 * GDPR/PIPA compliance: Analytics only runs after explicit user consent.
 * Consent state is persisted to localStorage.
 */

const CONSENT_STORAGE_KEY = 'analytics_consent';
const CONSENT_TIMESTAMP_KEY = 'analytics_consent_at';

export type ConsentState = 'unknown' | 'granted' | 'denied';

let currentConsent: ConsentState = 'unknown';
let consentListeners: Array<(state: ConsentState) => void> = [];

/**
 * Initialize consent state from localStorage.
 * Call once at app startup.
 */
export function initConsent(): ConsentState {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);

  if (stored === 'granted' || stored === 'denied') {
    currentConsent = stored;
  } else {
    currentConsent = 'unknown';
  }

  return currentConsent;
}

/**
 * Get current consent state.
 */
export function getConsent(): ConsentState {
  return currentConsent;
}

/**
 * Check if analytics tracking is allowed.
 */
export function isAnalyticsEnabled(): boolean {
  return currentConsent === 'granted';
}

/**
 * Check if consent banner should be shown.
 */
export function shouldShowConsentBanner(): boolean {
  return currentConsent === 'unknown';
}

/**
 * Grant analytics consent.
 * Persists to localStorage and notifies listeners.
 */
export function grantConsent(): void {
  currentConsent = 'granted';
  persistConsent('granted');
  notifyListeners('granted');
}

/**
 * Deny analytics consent.
 * Persists to localStorage and notifies listeners.
 */
export function denyConsent(): void {
  currentConsent = 'denied';
  persistConsent('denied');
  notifyListeners('denied');
}

/**
 * Reset consent (for testing or "manage cookies" flow).
 */
export function resetConsent(): void {
  currentConsent = 'unknown';
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
  notifyListeners('unknown');
}

/**
 * Subscribe to consent state changes.
 * Returns unsubscribe function.
 */
export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  consentListeners.push(listener);
  return () => {
    consentListeners = consentListeners.filter((l) => l !== listener);
  };
}

// ============================================================================
// Internal
// ============================================================================

function persistConsent(state: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, state);
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    // localStorage might be unavailable (private browsing, etc.)
  }
}

function notifyListeners(state: ConsentState): void {
  consentListeners.forEach((listener) => listener(state));
}
