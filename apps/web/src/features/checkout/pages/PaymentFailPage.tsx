import { Alert, Button } from '@housing-platform/ui';
import { Link, useSearchParams } from 'react-router-dom';

export function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') ?? 'Payment was not completed.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Alert variant="error">{message}</Alert>
      <p className="text-ink-muted mt-4 text-sm">
        You can retry payment from your booking details{orderId ? ` for order ${orderId}` : ''}.
      </p>
      <Link to="/bookings" className="mt-6 inline-flex">
        <Button variant="secondary">Back to bookings</Button>
      </Link>
    </div>
  );
}
