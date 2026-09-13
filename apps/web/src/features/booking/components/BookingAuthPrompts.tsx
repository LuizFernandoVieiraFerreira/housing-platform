/**
 * Auth-related prompt components for BookingPanel.
 * 
 * These are shown when the user needs to authenticate or verify email.
 */

import { Alert, Button, Card } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

import { BookingPriceHeader } from './BookingPriceHeader';

interface BookingUnauthenticatedProps {
  price: number;
  formatPrice: (amount: number) => string;
  minStayNights: number;
  bookingModeLabel: string;
  returnTo: string;
}

/**
 * Shown when user is not logged in.
 */
export function BookingUnauthenticated({
  price,
  formatPrice,
  minStayNights,
  bookingModeLabel,
  returnTo,
}: BookingUnauthenticatedProps) {
  return (
    <Card padding="md">
      <BookingPriceHeader
        price={price}
        formatPrice={formatPrice}
        minStayNights={minStayNights}
        bookingModeLabel={bookingModeLabel}
        variant="unauthenticated"
      />
      <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mt-6 block">
        <Button className="w-full" size="lg">
          Sign in to book
        </Button>
      </Link>
    </Card>
  );
}

/**
 * Shown when user needs to verify their email.
 */
export function BookingUnverified() {
  return (
    <Card padding="md">
      <Alert variant="error">Verify your email before booking a stay.</Alert>
      <Link to="/signup/verify-email" className="mt-4 inline-flex">
        <Button variant="secondary">Go to verification</Button>
      </Link>
    </Card>
  );
}

/**
 * Shown when no rooms are available.
 */
export function BookingNoRooms() {
  return (
    <Card padding="md">
      <Alert variant="error">No rooms are currently available to book.</Alert>
    </Card>
  );
}
