/**
 * Quote summary display component.
 * 
 * Pure presentational component - receives data, renders UI.
 */

import type { BookingQuote } from '../model';

interface BookingQuoteSummaryProps {
  quote: BookingQuote;
  formatPrice: (amount: number) => string;
}

export function BookingQuoteSummary({ quote, formatPrice }: BookingQuoteSummaryProps) {
  return (
    <div className="border-surface-subtle bg-surface-muted/40 space-y-2 rounded-lg border p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-ink-muted">
          Rent ({quote.nights} night{quote.nights === 1 ? '' : 's'})
        </span>
        <span className="text-ink">{formatPrice(quote.rentKrw)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ink-muted">Service fee</span>
        <span className="text-ink">{formatPrice(quote.serviceFeeKrw)}</span>
      </div>
      <div className="border-surface-subtle flex justify-between border-t pt-2 font-semibold">
        <span className="text-ink">Total</span>
        <span className="text-ink">{formatPrice(quote.totalKrw)}</span>
      </div>
    </div>
  );
}
