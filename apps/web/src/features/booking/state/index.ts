/**
 * Booking state layer - client-side state management.
 *
 * This layer contains:
 * - Form state hooks (React Hook Form wrappers)
 * - Local UI state (if needed)
 * - Derived state calculations
 *
 * Rules:
 * - No API calls (those go in hooks/)
 * - Pure client-side state management
 * - Can import from model/ layer
 */

export { useBookingForm, type UseBookingFormOptions, type UseBookingFormReturn } from './use-booking-form';
