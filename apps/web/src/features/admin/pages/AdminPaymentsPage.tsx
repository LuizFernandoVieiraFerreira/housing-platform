import { Alert, Card, EmptyState, PageHeader } from '@housing-platform/ui';

import { formatKrw } from '@/features/booking/lib/booking-utils';
import { useAdminPayments } from '@/features/admin/hooks/useAdmin';

function getPaymentStatusLabel(status: string): string {
  return status.replace('_', ' ');
}

export function AdminPaymentsPage() {
  const { data: payments, isLoading, error } = useAdminPayments();

  if (isLoading) {
    return <p className="text-ink-muted text-sm">Loading payments...</p>;
  }

  if (error) {
    return <Alert variant="error">Unable to load payments.</Alert>;
  }

  return (
    <Card>
      <PageHeader
        title="Payments"
        description="Read-only payment records from Toss checkout."
      />

      {!payments?.length ? (
        <EmptyState className="mt-10" description="No payments yet." />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-ink-muted border-surface-subtle border-b">
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-surface-subtle border-b last:border-b-0">
                  <td className="text-ink px-3 py-3">{payment.propertyTitle ?? 'Unknown listing'}</td>
                  <td className="text-ink-muted px-3 py-3">{payment.customerName ?? 'Unknown customer'}</td>
                  <td className="text-ink px-3 py-3 font-medium">{formatKrw(payment.amountKrw)}</td>
                  <td className="text-ink-muted px-3 py-3 capitalize">{getPaymentStatusLabel(payment.status)}</td>
                  <td className="text-ink-muted px-3 py-3">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
