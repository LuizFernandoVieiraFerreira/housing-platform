/**
 * Admin model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
 * - Schemas (Zod validation)
 * - Constants (business rules, configuration)
 * - Utils (pure functions, no React/i18n dependencies)
 *
 * Rules:
 * - No React imports
 * - No i18n dependencies
 * - No external API calls
 * - Fully testable without mocking
 */

// Types
export type {
  // Shared types from @housing-platform/types
  AdminDashboardStats,
  AdminHostListItem,
  AdminPaymentListItem,
  AdminPropertyListItem,
  AuditLogListItem,
  HostBookingListItem,
  HostStatus,
  HousingRequestListItem,
  HousingRequestStatus,
  PaymentStatus,
  // Row types (for mappers)
  AdminBookingRow,
  AdminHostRow,
  AdminPaymentRow,
  AdminPropertyRow,
  AuditLogRow,
  HousingRequestRow,
} from './types';

// Schemas
// (add exports here when schemas are added)

// Constants
export {
  ACTIVE_HOST_STATUSES,
  ADMIN_ROLE,
  AUDIT_LOG_ACTIONS,
  AUDIT_LOGS_DEFAULT_LIMIT,
  CLOSED_HOUSING_REQUEST_STATUSES,
  FAILED_PAYMENT_STATUSES,
  HOST_STATUS_CONFIG,
  HOUSING_REQUEST_STATUS_CONFIG,
  OPEN_BOOKING_STATUSES,
  OPEN_HOUSING_REQUEST_STATUSES,
  PAYMENT_STATUS_CONFIG,
  PENDING_HOST_STATUSES,
  PENDING_PROPERTY_STATUSES,
  PUBLISHED_PROPERTY_STATUSES,
  SUCCESSFUL_PAYMENT_STATUSES,
  type AuditLogAction,
} from './constants';

// Utils
export {
  canApproveHost,
  canTransitionHousingRequest,
  getHostStatusConfig,
  getHousingRequestStatusConfig,
  getPaymentStatusConfig,
  isActiveHost,
  isAdminProfile,
  isFailedPayment,
  isOpenHousingRequest,
  isPendingHost,
  isSuccessfulPayment,
} from './utils';
