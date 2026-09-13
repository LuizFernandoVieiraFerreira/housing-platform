/**
 * Host feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { HostStatus, PropertyStatus, RoomStatus, BookingMode } from './types';

// ============================================================================
// Host Status Groups
// ============================================================================

/**
 * Host statuses that allow creating new properties.
 */
export const HOST_ACTIVE_STATUSES: readonly HostStatus[] = ['active'] as const;

/**
 * Host statuses that prevent any host actions.
 */
export const HOST_BLOCKED_STATUSES: readonly HostStatus[] = ['suspended'] as const;

// ============================================================================
// Property Status Groups
// ============================================================================

/**
 * Property statuses that can be edited by the host.
 */
export const PROPERTY_EDITABLE_STATUSES: readonly PropertyStatus[] = [
  'draft',
  'pending_review',
  'published',
] as const;

/**
 * Property statuses that can be submitted for review.
 */
export const PROPERTY_SUBMITTABLE_STATUSES: readonly PropertyStatus[] = ['draft'] as const;

/**
 * Property statuses visible to the public.
 */
export const PROPERTY_PUBLIC_STATUSES: readonly PropertyStatus[] = ['published'] as const;

/**
 * Property statuses considered terminal (archived).
 */
export const PROPERTY_TERMINAL_STATUSES: readonly PropertyStatus[] = ['archived'] as const;

// ============================================================================
// Room Status Groups
// ============================================================================

/**
 * Room statuses that allow bookings.
 */
export const ROOM_BOOKABLE_STATUSES: readonly RoomStatus[] = ['available'] as const;

/**
 * Room statuses that prevent new bookings.
 */
export const ROOM_UNAVAILABLE_STATUSES: readonly RoomStatus[] = [
  'unavailable',
  'archived',
] as const;

// ============================================================================
// Business Rules
// ============================================================================

/**
 * Maximum number of properties a host can create.
 */
export const MAX_HOST_PROPERTIES = 50;

/**
 * Maximum number of rooms per property.
 */
export const MAX_ROOMS_PER_PROPERTY = 20;

/**
 * Maximum number of amenities per property.
 */
export const MAX_AMENITIES_PER_PROPERTY = 20;

/**
 * Maximum number of tags per property.
 */
export const MAX_TAGS_PER_PROPERTY = 10;

/**
 * Minimum monthly rent (in KRW).
 */
export const MIN_MONTHLY_RENT_KRW = 100_000;

/**
 * Maximum monthly rent (in KRW).
 */
export const MAX_MONTHLY_RENT_KRW = 50_000_000;

/**
 * Minimum stay nights for a property.
 */
export const MIN_STAY_NIGHTS = 1;

/**
 * Maximum stay nights for a property.
 */
export const MAX_STAY_NIGHTS = 365;

/**
 * Maximum walking distance to station (in minutes).
 */
export const MAX_STATION_WALK_MIN = 120;

// ============================================================================
// Status Metadata
// ============================================================================

/**
 * Host status configuration for UI rendering.
 */
export const HOST_STATUS_CONFIG: Record<
  HostStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    canCreateProperty: boolean;
    canManageBookings: boolean;
  }
> = {
  pending: { variant: 'warning', canCreateProperty: false, canManageBookings: false },
  active: { variant: 'success', canCreateProperty: true, canManageBookings: true },
  suspended: { variant: 'error', canCreateProperty: false, canManageBookings: false },
} as const;

/**
 * Property status configuration for UI rendering.
 */
export const PROPERTY_STATUS_CONFIG: Record<
  PropertyStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    canEdit: boolean;
    canSubmit: boolean;
    canArchive: boolean;
    isPublic: boolean;
  }
> = {
  draft: { variant: 'default', canEdit: true, canSubmit: true, canArchive: true, isPublic: false },
  pending_review: {
    variant: 'warning',
    canEdit: true,
    canSubmit: false,
    canArchive: true,
    isPublic: false,
  },
  published: {
    variant: 'success',
    canEdit: true,
    canSubmit: false,
    canArchive: true,
    isPublic: true,
  },
  archived: {
    variant: 'default',
    canEdit: false,
    canSubmit: false,
    canArchive: false,
    isPublic: false,
  },
} as const;

/**
 * Room status configuration for UI rendering.
 */
export const ROOM_STATUS_CONFIG: Record<
  RoomStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    canBook: boolean;
    canEdit: boolean;
  }
> = {
  available: { variant: 'success', canBook: true, canEdit: true },
  unavailable: { variant: 'warning', canBook: false, canEdit: true },
  archived: { variant: 'default', canBook: false, canEdit: false },
} as const;

/**
 * Booking mode configuration.
 */
export const BOOKING_MODE_CONFIG: Record<
  BookingMode,
  {
    requiresApproval: boolean;
  }
> = {
  instant: { requiresApproval: false },
  request: { requiresApproval: true },
} as const;
