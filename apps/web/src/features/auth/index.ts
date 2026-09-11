/**
 * Auth feature public API
 *
 * Usage:
 *   import { useAuth, AuthProvider } from '@/features/auth';
 */

// Hooks
export { useAuth, type AuthContextValue } from './hooks/useAuth';

// Context
export { AuthProvider } from './context/AuthProvider';

// Route guards (for use in routing)
export { GuestRoute } from './components/GuestRoute';
export { MarketplaceRoute } from './components/MarketplaceRoute';
export { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
export { AuthLayout } from './layouts/AuthLayout';
