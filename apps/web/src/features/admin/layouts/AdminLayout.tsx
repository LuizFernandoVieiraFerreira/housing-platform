import { Card, CardDescription, CardHeader, CardTitle } from '@housing-platform/ui';
import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Properties', to: '/admin/properties' },
  { label: 'Hosts', to: '/admin/hosts' },
  { label: 'Bookings', to: '/admin/bookings' },
  { label: 'Payments', to: '/admin/payments' },
  { label: 'Housing requests', to: '/admin/housing-requests' },
  { label: 'Audit logs', to: '/admin/audit-logs' },
];

export function AdminLayout() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-64">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Admin console</CardTitle>
            <CardDescription>Platform operations</CardDescription>
          </CardHeader>

          <nav className="mt-6 space-y-1">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </Card>
      </aside>

      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  );
}
