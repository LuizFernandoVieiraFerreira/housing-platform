/**
 * Admin feature constants.
 *
 * Business rules, configuration values, and enums.
 * Keep this file pure (no React, no i18n, no external dependencies).
 */

import type { HostStatus, HousingRequestStatus, PaymentStatus } from './types';

// ============================================================================
// Admin Role
// ============================================================================

/**
 * The role value that identifies an admin user.
 */
export const ADMIN_ROLE = 'admin' as const;

// ============================================================================
// Status Groups
// ============================================================================

/**
 * Host statuses that require admin review.
 */
export const PENDING_HOST_STATUSES: readonly HostStatus[] = ['pending'] as const;

/**
 * Host statuses considered active.
 */
export const ACTIVE_HOST_STATUSES: readonly HostStatus[] = ['active'] as const;

/**
 * Housing request statuses considered "open" (needing attention).
 */
export const OPEN_HOUSING_REQUEST_STATUSES: readonly HousingRequestStatus[] = [
  'new',
  'in_progress',
] as const;

/**
 * Housing request statuses considered "closed" (resolved).
 */
export const CLOSED_HOUSING_REQUEST_STATUSES: readonly HousingRequestStatus[] = [
  'closed',
] as const;

/**
 * Payment statuses that are successful.
 */
export const SUCCESSFUL_PAYMENT_STATUSES: readonly PaymentStatus[] = ['confirmed'] as const;

/**
 * Payment statuses that indicate failure.
 */
export const FAILED_PAYMENT_STATUSES: readonly PaymentStatus[] = ['failed', 'cancelled'] as const;

// ============================================================================
// Property Status
// ============================================================================

/**
 * Property statuses that require admin review.
 */
export const PENDING_PROPERTY_STATUSES = ['pending_review'] as const;

/**
 * Property statuses that are published and visible.
 */
export const PUBLISHED_PROPERTY_STATUSES = ['published'] as const;

// ============================================================================
// Booking Status Groups (for admin dashboard)
// ============================================================================

/**
 * Booking statuses considered "open" (requiring attention).
 */
export const OPEN_BOOKING_STATUSES = [
  'requested',
  'pending_payment',
  'payment_failed',
] as const;

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
    canApprove: boolean;
  }
> = {
  pending: { variant: 'warning', canApprove: true },
  active: { variant: 'success', canApprove: false },
  suspended: { variant: 'error', canApprove: false },
} as const;

/**
 * Housing request status configuration for UI rendering.
 */
export const HOUSING_REQUEST_STATUS_CONFIG: Record<
  HousingRequestStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
    canTransition: boolean;
  }
> = {
  new: { variant: 'info', canTransition: true },
  in_progress: { variant: 'warning', canTransition: true },
  closed: { variant: 'default', canTransition: false },
} as const;

/**
 * Payment status configuration for UI rendering.
 */
export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  }
> = {
  pending: { variant: 'warning' },
  confirmed: { variant: 'success' },
  failed: { variant: 'error' },
  cancelled: { variant: 'default' },
} as const;

// ============================================================================
// Audit Log Actions
// ============================================================================

/**
 * Known audit log action types for filtering/display.
 */
export const AUDIT_LOG_ACTIONS = [
  'property.publish',
  'property.reject',
  'host.approve',
  'host.suspend',
  'booking.approve',
  'booking.reject',
  'housing_request.update_status',
] as const;

export type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[number];

// ============================================================================
// Pagination
// ============================================================================

/**
 * Default limit for audit logs query.
 */
export const AUDIT_LOGS_DEFAULT_LIMIT = 100;
