/**
 * Booking feature public API
 *
 * Layer structure:
 * - model/     Pure domain: types, schemas, constants, pure utils
 * - api/       Data fetching, mappers
 * - state/     Client-side state management
 * - hooks/     React Query + state composition
 * - components/ UI components
 *
 * Usage:
 *   import { useBookingQuote, BookingPanel, bookingKeys } from '@/features/booking';
 */

// ============================================================================
// Model Layer (Pure Domain)
// ============================================================================

// Types
export type {
  Booking,
  BookingDetail,
  BookingListItem,
  BookingQuote,
  BookingStatus,
  BookingType,
  CreateBookingHoldInput,
  QuoteBookingInput,
} from './model';

// Schemas
export { createBookingHoldSchema, quoteBookingSchema } from './model';

// Constants
export {
  ACTIVE_STATUSES,
  BOOKING_TYPES,
  CANCELLABLE_STATUSES,
  DEFAULT_HOLD_DURATION_MINUTES,
  MAX_GUEST_COUNT,
  PAYABLE_STATUSES,
  STATUS_CONFIG,
  TERMINAL_STATUSES,
} from './model';

// Pure Utils
export {
  calculateNights,
  canCancelBooking,
  canPayBooking,
  getDefaultCheckOut,
  getHoldRemainingMs,
  getStatusConfig,
  isActiveBooking,
  isHoldExpired,
  isTerminalBooking,
  isValidDateRange,
} from './model';

// ============================================================================
// API Layer
// ============================================================================

export { bookingKeys } from './keys';

// Result-returning API functions
export {
  cancelOwnBookingSafe,
  createBookingHoldSafe,
  fetchBookingDetailSafe,
  fetchMyBookingsSafe,
  quoteBookingSafe,
} from './api/booking-api';

// Mappers (for advanced use cases)
export { mapBookingDetailRow, mapBookingListRow, mapQuoteRow } from './api/mappers';

// ============================================================================
// State Layer
// ============================================================================

export { useBookingForm, type UseBookingFormOptions, type UseBookingFormReturn } from './state';

// ============================================================================
// Hooks Layer (Composition)
// ============================================================================

export {
  useBookingDetail,
  useBookingQuote,
  useCancelBooking,
  useCreateBookingHold,
  useMyBookings,
} from './hooks/useBooking';

export { useBookingPanel, type BookingPanelState } from './hooks/useBookingPanel';

// ============================================================================
// Components
// ============================================================================

export { BookingPanel } from './components/BookingPanel';
export { BookingForm } from './components/BookingForm';
export { BookingQuoteSummary } from './components/BookingQuoteSummary';
export { BookingPriceHeader } from './components/BookingPriceHeader';
export {
  BookingNoRooms,
  BookingUnauthenticated,
  BookingUnverified,
} from './components/BookingAuthPrompts';

// ============================================================================
// Utilities (with i18n/formatting)
// ============================================================================

export {
  formatBookingDate,
  formatKrw,
  getBookingErrorMessage,
  getBookingStatusLabel,
} from './lib/booking-utils';
