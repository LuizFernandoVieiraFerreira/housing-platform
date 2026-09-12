/**
 * Host feature public API
 *
 * Usage:
 *   import { useCurrentHost, HostRoute, hostKeys } from '@/features/host';
 */

// Query keys (colocated with feature)
export { hostKeys } from './keys';

// Hooks
export { useCurrentHost } from './hooks/useHost';

// API utilities
export { isHostProfile } from './api/host-api';

// Route guard
export { HostRoute } from './components/HostRoute';

// Layouts
export { HostLayout } from './layouts/HostLayout';
