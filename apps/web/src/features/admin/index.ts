/**
 * Admin feature public API
 *
 * Layer structure:
 * - model/     Pure domain: types, schemas, constants, pure utils
 * - api/       Data fetching, mappers
 * - hooks/     React Query composition
 * - components/ UI components
 * - layouts/   Layout components
 * - pages/     Page components
 *
 * Usage:
 *   import { useAdminDashboardStats, isAdminProfile, adminKeys } from '@/features/admin';
 */

// ============================================================================
// Model Layer (Pure Domain)
// ============================================================================

// Types
export type {
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
} from './model';

// Constants
export {
  ACTIVE_HOST_STATUSES,
  ADMIN_ROLE,
  AUDIT_LOG_ACTIONS,
  CLOSED_HOUSING_REQUEST_STATUSES,
  FAILED_PAYMENT_STATUSES,
  HOUSING_REQUEST_STATUS_CONFIG,
  OPEN_BOOKING_STATUSES,
  OPEN_HOUSING_REQUEST_STATUSES,
  PENDING_HOST_STATUSES,
  PENDING_PROPERTY_STATUSES,
  PUBLISHED_PROPERTY_STATUSES,
  SUCCESSFUL_PAYMENT_STATUSES,
} from './model';

// Pure Utils
export {
  canApproveHost,
  canTransitionHousingRequest,
  getHousingRequestStatusConfig,
  isActiveHost,
  isAdminProfile,
  isFailedPayment,
  isOpenHousingRequest,
  isPendingHost,
  isSuccessfulPayment,
} from './model';

// ============================================================================
// API Layer
// ============================================================================

// Query keys (colocated with feature)
export { adminKeys } from './keys';

// Mappers
export {
  mapAdminBookingRow,
  mapAdminHostRow,
  mapAdminPaymentRow,
  mapAdminPropertyRow,
  mapAuditLogRow,
  mapHousingRequestRow,
} from './api/mappers';

// ============================================================================
// Components
// ============================================================================

// Route guard
export { AdminRoute } from './components/AdminRoute';

// Layouts
export { AdminLayout } from './layouts/AdminLayout';

// ============================================================================
// Hooks
// ============================================================================

export {
  useAdminDashboardStats,
  useAdminProperties,
  useAdminHosts,
  useAdminBookings,
  useAdminPayments,
  useAdminHousingRequests,
  useAdminAuditLogs,
} from './hooks/useAdmin';
