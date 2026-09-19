import { ADMIN_ROUTES, registerAdminRoutes } from './admin';
import { BOOKING_ROUTES, registerBookingRoutes } from './bookings';
import { EXTENSION_ROUTES, registerExtensionRoutes } from './extensions';
import { HOST_ROUTES, registerHostRoutes } from './hosts';
import { NOTIFICATION_ROUTES, registerNotificationRoutes } from './notifications';
import { PAYMENT_ROUTES, registerPaymentRoutes } from './payments';
import { PROFILE_ROUTES, registerProfileRoutes } from './profile';
import { PROPERTY_ROUTES, registerPropertyRoutes } from './properties';

export const REGISTERED_SUPABASE_ROUTES = [
  ...PROPERTY_ROUTES,
  ...BOOKING_ROUTES,
  ...PAYMENT_ROUTES,
  ...HOST_ROUTES,
  ...ADMIN_ROUTES,
  ...NOTIFICATION_ROUTES,
  ...PROFILE_ROUTES,
  ...EXTENSION_ROUTES,
] as const;

registerPropertyRoutes();
registerBookingRoutes();
registerPaymentRoutes();
registerHostRoutes();
registerAdminRoutes();
registerNotificationRoutes();
registerProfileRoutes();
registerExtensionRoutes();
