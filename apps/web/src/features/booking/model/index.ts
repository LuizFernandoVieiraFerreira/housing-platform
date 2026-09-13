/**
 * Booking model layer - pure domain definitions.
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
  Booking,
  BookingDetail,
  BookingDetailRow,
  BookingListItem,
  BookingListRow,
  BookingPriceSnapshot,
  BookingPriceSnapshotRow,
  BookingQuote,
  BookingQuoteRow,
  BookingStatus,
  BookingType,
  CreateBookingHoldInput,
  QuoteBookingInput,
} from './types';

// Schemas
export { createBookingHoldSchema, quoteBookingSchema } from './schemas';

// Constants
export {
  ACTIVE_STATUSES,
  BOOKING_TYPES,
  CANCELLABLE_STATUSES,
  DEFAULT_HOLD_DURATION_MINUTES,
  MAX_ADVANCE_BOOKING_DAYS,
  MAX_GUEST_COUNT,
  MIN_ADVANCE_BOOKING_DAYS,
  PAYABLE_STATUSES,
  STATUS_CONFIG,
  TERMINAL_STATUSES,
} from './constants';

// Utils
export {
  calculateNights,
  calculateServiceFeePercent,
  calculateTotal,
  canCancelBooking,
  canPayBooking,
  getDefaultCheckOut,
  getHoldRemainingMs,
  getStatusConfig,
  isActiveBooking,
  isHoldExpired,
  isTerminalBooking,
  isValidDateRange,
} from './utils';
