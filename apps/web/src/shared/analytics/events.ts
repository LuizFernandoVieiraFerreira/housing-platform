/**
 * Typed analytics event definitions.
 *
 * Uses discriminated unions so TypeScript enforces correct properties per event.
 * Follow the `object_action` naming convention (e.g., `booking_started`).
 *
 * Guidelines:
 * - Track decisions and outcomes, not every click
 * - Use IDs (property_id), not PII (never email, name, address)
 * - Past tense for completed actions
 * - Prefix by feature area for organization
 */

// ============================================================================
// Auth Events
// ============================================================================

export type AuthMethod = 'email' | 'google' | 'kakao';

export type AuthEvent =
  | { name: 'signup_started'; properties: { method: AuthMethod } }
  | { name: 'signup_completed'; properties: { method: AuthMethod } }
  | { name: 'login_completed'; properties: { method: AuthMethod } }
  | { name: 'login_failed'; properties: { method: AuthMethod; error_code?: string } }
  | { name: 'logout_completed'; properties: Record<string, never> }
  | { name: 'password_reset_requested'; properties: Record<string, never> };

// ============================================================================
// Search & Discovery Events
// ============================================================================

export type SearchEvent =
  | {
      name: 'search_submitted';
      properties: {
        query?: string;
        property_type?: string;
        has_date_filter: boolean;
        has_price_filter: boolean;
        result_count: number;
      };
    }
  | {
      name: 'ai_search_submitted';
      properties: {
        query: string;
        result_count: number;
      };
    }
  | {
      name: 'property_viewed';
      properties: {
        property_id: string;
        property_type: string;
        district: string;
        source: 'search' | 'featured' | 'direct' | 'ai_search';
      };
    }
  | {
      name: 'property_favorited';
      properties: {
        property_id: string;
      };
    };

// ============================================================================
// Booking Funnel Events
// ============================================================================

export type BookingEvent =
  | {
      name: 'booking_started';
      properties: {
        property_id: string;
        room_id: string;
        booking_mode: 'instant' | 'request';
      };
    }
  | {
      name: 'booking_quote_viewed';
      properties: {
        property_id: string;
        total_price_krw: number;
        stay_nights: number;
      };
    }
  | {
      name: 'booking_hold_created';
      properties: {
        booking_id: string;
        property_id: string;
        total_price_krw: number;
      };
    }
  | {
      name: 'checkout_started';
      properties: {
        booking_id: string;
        total_price_krw: number;
      };
    }
  | {
      name: 'payment_initiated';
      properties: {
        booking_id: string;
        total_price_krw: number;
        payment_method: 'card' | 'transfer' | 'mock';
      };
    }
  | {
      name: 'payment_completed';
      properties: {
        booking_id: string;
        total_price_krw: number;
        payment_method: string;
      };
    }
  | {
      name: 'payment_failed';
      properties: {
        booking_id: string;
        error_code?: string;
      };
    };

// ============================================================================
// Host Events
// ============================================================================

export type HostEvent =
  | { name: 'host_signup_started'; properties: Record<string, never> }
  | { name: 'host_signup_completed'; properties: Record<string, never> }
  | {
      name: 'host_property_created';
      properties: {
        property_type: string;
      };
    }
  | {
      name: 'host_property_published';
      properties: {
        property_id: string;
      };
    }
  | {
      name: 'host_booking_approved';
      properties: {
        booking_id: string;
      };
    }
  | {
      name: 'host_booking_rejected';
      properties: {
        booking_id: string;
        reason?: string;
      };
    };

// ============================================================================
// Engagement Events
// ============================================================================

export type EngagementEvent =
  | {
      name: 'page_viewed';
      properties: {
        page_name: string;
        referrer?: string;
      };
    }
  | {
      name: 'support_chat_opened';
      properties: {
        source: string;
      };
    }
  | {
      name: 'notification_clicked';
      properties: {
        notification_type: string;
      };
    }
  | {
      name: 'locale_changed';
      properties: {
        from_locale: string;
        to_locale: string;
      };
    };

// ============================================================================
// Union Type
// ============================================================================

/**
 * All analytics events. Use this type for the track() function.
 */
export type AnalyticsEvent =
  | AuthEvent
  | SearchEvent
  | BookingEvent
  | HostEvent
  | EngagementEvent;

/**
 * Extract event names for type safety.
 */
export type AnalyticsEventName = AnalyticsEvent['name'];

/**
 * User properties that persist across events.
 * Set via identify() after login.
 */
export interface UserProperties {
  account_type?: 'guest' | 'host' | 'admin';
  locale?: string;
  signup_date?: string;
  email_verified?: boolean;
}
