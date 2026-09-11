/**
 * Admin feature public API
 *
 * Usage:
 *   import { useAdminDashboardStats, isAdminProfile } from '@/features/admin';
 */

// API utilities
export { isAdminProfile } from './api/admin-api';

// Route guard
export { AdminRoute } from './components/AdminRoute';

// Layouts
export { AdminLayout } from './layouts/AdminLayout';

// Hooks
export {
  useAdminDashboardStats,
  useAdminProperties,
  useAdminHosts,
  useAdminBookings,
  useAdminPayments,
  useAdminHousingRequests,
  useAdminAuditLogs,
} from './hooks/useAdmin';
