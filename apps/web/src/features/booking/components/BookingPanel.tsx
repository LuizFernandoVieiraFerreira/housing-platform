/**
 * BookingPanel - Main booking component for property detail pages.
 *
 * This component uses the presenter pattern:
 * - Business logic is in useBookingPanel hook
 * - UI is split into focused sub-components
 * - This component handles state-based rendering
 */

import { Card } from '@housing-platform/ui';
import type { PropertyDetail } from '@housing-platform/types';

import { useFormatPrice } from '@/i18n/CurrencyProvider';
import { useBookingPanel } from '../hooks/useBookingPanel';
import { BookingPriceHeader } from './BookingPriceHeader';
import { BookingForm } from './BookingForm';
import { BookingNoRooms, BookingUnauthenticated, BookingUnverified } from './BookingAuthPrompts';

interface BookingPanelProps {
  property: PropertyDetail;
}

export function BookingPanel({ property }: BookingPanelProps) {
  const formatPrice = useFormatPrice();

  const {
    state,
    availableRooms,
    selectedRoom,
    form,
    quote,
    isQuoteLoading,
    quoteError,
    submitError,
    canSubmit,
    handleSubmit,
    displayPrice,
    bookingModeLabel,
    submitButtonLabel,
    bookingModeDescription,
  } = useBookingPanel({ property });

  // Handle different states
  switch (state.status) {
    case 'no-rooms':
      return <BookingNoRooms />;

    case 'unauthenticated':
      return (
        <BookingUnauthenticated
          price={property.monthlyPriceMin}
          formatPrice={formatPrice}
          minStayNights={property.minStayNights}
          bookingModeLabel={bookingModeLabel}
          returnTo={state.returnTo}
        />
      );

    case 'unverified':
      return <BookingUnverified />;

    case 'ready':
      return (
        <Card padding="md">
          <BookingPriceHeader
            price={displayPrice}
            formatPrice={formatPrice}
            minStayNights={property.minStayNights}
            bookingModeLabel={bookingModeLabel}
          />
          <BookingForm
            form={form}
            availableRooms={availableRooms}
            selectedRoom={selectedRoom}
            quote={quote}
            isQuoteLoading={isQuoteLoading}
            quoteError={quoteError}
            submitError={submitError}
            canSubmit={canSubmit}
            onSubmit={handleSubmit}
            submitButtonLabel={submitButtonLabel}
            bookingModeDescription={bookingModeDescription}
            formatPrice={formatPrice}
          />
        </Card>
      );
  }
}
