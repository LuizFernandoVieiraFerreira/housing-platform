import type { ReactNode } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@housing-platform/ui';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentProfile } from '@/features/account/hooks/useProfile';

const accountLinks = [
  { label: 'Overview', to: '/account' },
  { label: 'Profile', to: '/account/profile' },
  { label: 'Bookings', to: '/bookings' },
];

interface AccountLayoutProps {
  children?: ReactNode;
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-64">
        <Card padding="md">
          <CardHeader>
            <CardTitle>{profile?.full_name ?? 'Your account'}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>

          <nav className="mt-6 space-y-1">
            {accountLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/account'}
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

          <CardFooter className="block">
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-ink-muted hover:text-ink text-sm font-medium"
            >
              Sign out
            </button>
          </CardFooter>
        </Card>
      </aside>

      <section className="flex-1">
        {children ?? <Outlet />}
      </section>
    </div>
  );
}
