/** OpenAPI-aligned booking enums (camelCase contract). */

export type BookingStatus =
  | 'requested'
  | 'pending_payment'
  | 'expired'
  | 'confirmed'
  | 'payment_failed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type BookingType = 'instant' | 'request';

export type BookingMode = 'instant' | 'request';
