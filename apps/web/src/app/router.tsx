import { lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { MapLayout } from '@/app/layouts/MapLayout';
import { AccountLayout } from '@/features/account/layouts/AccountLayout';
import { AccountPage } from '@/features/account/pages/AccountPage';
import { BookingDetailPage } from '@/features/account/pages/BookingDetailPage';
import { BookingsPage } from '@/features/account/pages/BookingsPage';
import { ProfilePage } from '@/features/account/pages/ProfilePage';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { MarketplaceRoute } from '@/features/auth/components/MarketplaceRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { HostRoute } from '@/features/host/components/HostRoute';
import { HostLayout } from '@/features/host/layouts/HostLayout';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { AdminLayout } from '@/features/admin/layouts/AdminLayout';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { HostLoginPage } from '@/features/auth/pages/HostLoginPage';
import { HostSignUpPage } from '@/features/auth/pages/HostSignUpPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { PropertyDetailPage } from '@/features/listings/pages/PropertyDetailPage';
import { professionalPlatforms } from '@/features/platforms/lib/professional-platforms';
import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';
import { MapSearchPage } from '@/features/search/pages/MapSearchPage';
import { MessagesPage } from '@/features/support/pages/MessagesPage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { LazyRoute } from '@/shared/components/LazyRoute';
import { LegalPage } from '@/shared/pages/LegalPage';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';

const CheckoutPage = lazy(() =>
  import('@/features/checkout/pages/CheckoutPage').then((module) => ({
    default: module.CheckoutPage,
  })),
);
const PaymentSuccessPage = lazy(() =>
  import('@/features/checkout/pages/PaymentSuccessPage').then((module) => ({
    default: module.PaymentSuccessPage,
  })),
);
const PaymentFailPage = lazy(() =>
  import('@/features/checkout/pages/PaymentFailPage').then((module) => ({
    default: module.PaymentFailPage,
  })),
);
const HostRegisterPage = lazy(() =>
  import('@/features/host/pages/HostRegisterPage').then((module) => ({
    default: module.HostRegisterPage,
  })),
);
const HostDashboardPage = lazy(() =>
  import('@/features/host/pages/HostDashboardPage').then((module) => ({
    default: module.HostDashboardPage,
  })),
);
const HostPropertiesPage = lazy(() =>
  import('@/features/host/pages/HostPropertiesPage').then((module) => ({
    default: module.HostPropertiesPage,
  })),
);
const HostPropertyFormPage = lazy(() =>
  import('@/features/host/pages/HostPropertyFormPage').then((module) => ({
    default: module.HostPropertyFormPage,
  })),
);
const HostBookingsPage = lazy(() =>
  import('@/features/host/pages/HostBookingsPage').then((module) => ({
    default: module.HostBookingsPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const AdminPropertiesPage = lazy(() =>
  import('@/features/admin/pages/AdminPropertiesPage').then((module) => ({
    default: module.AdminPropertiesPage,
  })),
);
const AdminHostsPage = lazy(() =>
  import('@/features/admin/pages/AdminHostsPage').then((module) => ({
    default: module.AdminHostsPage,
  })),
);
const AdminBookingsPage = lazy(() =>
  import('@/features/admin/pages/AdminBookingsPage').then((module) => ({
    default: module.AdminBookingsPage,
  })),
);
const AdminPaymentsPage = lazy(() =>
  import('@/features/admin/pages/AdminPaymentsPage').then((module) => ({
    default: module.AdminPaymentsPage,
  })),
);
const AdminHousingRequestsPage = lazy(() =>
  import('@/features/admin/pages/AdminHousingRequestsPage').then((module) => ({
    default: module.AdminHousingRequestsPage,
  })),
);
const AdminAuditLogsPage = lazy(() =>
  import('@/features/admin/pages/AdminAuditLogsPage').then((module) => ({
    default: module.AdminAuditLogsPage,
  })),
);

function CheckoutFallback() {
  return <p className="text-ink-muted px-4 py-16 text-sm">Loading checkout...</p>;
}

function HostFallback() {
  return <p className="text-ink-muted px-4 py-16 text-sm">Loading host portal...</p>;
}

function AdminFallback() {
  return <p className="text-ink-muted px-4 py-16 text-sm">Loading admin console...</p>;
}

const checkoutLazyRoute = {
  loadingFallback: <CheckoutFallback />,
  errorTitle: 'Unable to load checkout',
  errorDescription:
    'Something went wrong while loading checkout. Try again or return to your bookings.',
};

const hostLazyRoute = {
  loadingFallback: <HostFallback />,
  errorTitle: 'Unable to load host portal',
  errorDescription: 'Something went wrong while loading the host portal. Try again or return home.',
};

const adminLazyRoute = {
  loadingFallback: <AdminFallback />,
  errorTitle: 'Unable to load admin console',
  errorDescription:
    'Something went wrong while loading the admin console. Try again or return home.',
};

function RedirectToBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();

  return <Navigate to={`/bookings/${bookingId ?? ''}`} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MapLayout />}>
        <Route element={<MarketplaceRoute />}>
          <Route path="map" element={<MapSearchPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<GuestRoute defaultRedirect="/" />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<GuestRoute defaultRedirect="/host" />}>
          <Route path="host/login" element={<HostLoginPage />} />
          <Route path="host/signup" element={<HostSignUpPage />} />
        </Route>

        <Route element={<GuestRoute defaultRedirect="/admin" />}>
          <Route path="admin/login" element={<AdminLoginPage />} />
        </Route>

        <Route path="signup/verify-email" element={<VerifyEmailPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route element={<MarketplaceRoute />}>
          <Route index element={<HomePage />} />
          <Route path="listings/:propertyId" element={<PropertyDetailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="account/bookings" element={<Navigate to="/bookings" replace />} />
            <Route path="account/bookings/:bookingId" element={<RedirectToBookingDetail />} />

            <Route
              path="checkout/:bookingId"
              element={
                <LazyRoute {...checkoutLazyRoute}>
                  <CheckoutPage />
                </LazyRoute>
              }
            />
            <Route
              path="payment/success"
              element={
                <LazyRoute {...checkoutLazyRoute}>
                  <PaymentSuccessPage />
                </LazyRoute>
              }
            />
            <Route
              path="payment/fail"
              element={
                <LazyRoute {...checkoutLazyRoute}>
                  <PaymentFailPage />
                </LazyRoute>
              }
            />
          </Route>
        </Route>

        {professionalPlatforms.map(({ key, landingPath }) => (
          <Route
            key={key}
            path={landingPath}
            element={<ProfessionalPlatformPage platform={key} />}
          />
        ))}

        <Route path="terms" element={<LegalPage page="terms" />} />
        <Route path="privacy" element={<LegalPage page="privacy" />} />
        <Route path="refund" element={<LegalPage page="refund" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          <Route path="account" element={<AccountLayout />}>
            <Route index element={<AccountPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<HostRoute />}>
          <Route
            path="host/register"
            element={
              <LazyRoute {...hostLazyRoute}>
                <HostRegisterPage />
              </LazyRoute>
            }
          />
          <Route element={<HostLayout />}>
            <Route
              path="host"
              element={
                <LazyRoute {...hostLazyRoute}>
                  <HostDashboardPage />
                </LazyRoute>
              }
            />
            <Route
              path="host/properties"
              element={
                <LazyRoute {...hostLazyRoute}>
                  <HostPropertiesPage />
                </LazyRoute>
              }
            />
            <Route
              path="host/properties/new"
              element={
                <LazyRoute {...hostLazyRoute}>
                  <HostPropertyFormPage />
                </LazyRoute>
              }
            />
            <Route
              path="host/properties/:propertyId"
              element={
                <LazyRoute {...hostLazyRoute}>
                  <HostPropertyFormPage />
                </LazyRoute>
              }
            />
            <Route
              path="host/bookings"
              element={
                <LazyRoute {...hostLazyRoute}>
                  <HostBookingsPage />
                </LazyRoute>
              }
            />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="admin"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminDashboardPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/properties"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminPropertiesPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/hosts"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminHostsPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/bookings"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminBookingsPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/payments"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminPaymentsPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/housing-requests"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminHousingRequestsPage />
                </LazyRoute>
              }
            />
            <Route
              path="admin/audit-logs"
              element={
                <LazyRoute {...adminLazyRoute}>
                  <AdminAuditLogsPage />
                </LazyRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
