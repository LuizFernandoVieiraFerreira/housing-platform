/**
 * Pure utility functions for admin domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { HostStatus, HousingRequestStatus, PaymentStatus } from './types';
import {
  ADMIN_ROLE,
  PENDING_HOST_STATUSES,
  ACTIVE_HOST_STATUSES,
  OPEN_HOUSING_REQUEST_STATUSES,
  SUCCESSFUL_PAYMENT_STATUSES,
  FAILED_PAYMENT_STATUSES,
  HOST_STATUS_CONFIG,
  HOUSING_REQUEST_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from './constants';

// ============================================================================
// Admin Role Checks
// ============================================================================

/**
 * Check if a profile role indicates admin access.
 */
export function isAdminProfile(role: string | undefined): boolean {
  return role === ADMIN_ROLE;
}

// ============================================================================
// Host Status Checks
// ============================================================================

/**
 * Check if a host is pending review.
 */
export function isPendingHost(status: HostStatus): boolean {
  return PENDING_HOST_STATUSES.includes(status);
}

/**
 * Check if a host is active.
 */
export function isActiveHost(status: HostStatus): boolean {
  return ACTIVE_HOST_STATUSES.includes(status);
}

/**
 * Check if a host can be approved.
 */
export function canApproveHost(status: HostStatus): boolean {
  return HOST_STATUS_CONFIG[status].canApprove;
}

/**
 * Get host status configuration for UI rendering.
 */
export function getHostStatusConfig(status: HostStatus) {
  return HOST_STATUS_CONFIG[status];
}

// ============================================================================
// Housing Request Status Checks
// ============================================================================

/**
 * Check if a housing request is open (needs attention).
 */
export function isOpenHousingRequest(status: HousingRequestStatus): boolean {
  return OPEN_HOUSING_REQUEST_STATUSES.includes(status);
}

/**
 * Check if a housing request status can be transitioned.
 */
export function canTransitionHousingRequest(status: HousingRequestStatus): boolean {
  return HOUSING_REQUEST_STATUS_CONFIG[status].canTransition;
}

/**
 * Get housing request status configuration for UI rendering.
 */
export function getHousingRequestStatusConfig(status: HousingRequestStatus) {
  return HOUSING_REQUEST_STATUS_CONFIG[status];
}

// ============================================================================
// Payment Status Checks
// ============================================================================

/**
 * Check if a payment was successful.
 */
export function isSuccessfulPayment(status: PaymentStatus): boolean {
  return SUCCESSFUL_PAYMENT_STATUSES.includes(status);
}

/**
 * Check if a payment failed.
 */
export function isFailedPayment(status: PaymentStatus): boolean {
  return FAILED_PAYMENT_STATUSES.includes(status);
}

/**
 * Get payment status configuration for UI rendering.
 */
export function getPaymentStatusConfig(status: PaymentStatus) {
  return PAYMENT_STATUS_CONFIG[status];
}
