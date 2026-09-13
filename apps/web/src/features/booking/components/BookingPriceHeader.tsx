/**
 * Price header display component.
 *
 * Shows the monthly price and booking mode info.
 */

interface BookingPriceHeaderProps {
  price: number;
  formatPrice: (amount: number) => string;
  minStayNights: number;
  bookingModeLabel: string;
  /** Whether to show "/30 days" or "+/30 days" suffix */
  variant?: 'authenticated' | 'unauthenticated';
}

export function BookingPriceHeader({
  price,
  formatPrice,
  minStayNights,
  bookingModeLabel,
  variant = 'authenticated',
}: BookingPriceHeaderProps) {
  const suffix = variant === 'unauthenticated' ? '+/30 days' : '/30 days';

  return (
    <>
      <p className="text-ink text-2xl font-bold">
        {formatPrice(price)}
        <span className="text-ink-muted text-base font-normal">{suffix}</span>
      </p>
      <p className="text-ink-muted mt-2 text-sm">
        Minimum stay: {minStayNights} nights · {bookingModeLabel}
      </p>
    </>
  );
}
