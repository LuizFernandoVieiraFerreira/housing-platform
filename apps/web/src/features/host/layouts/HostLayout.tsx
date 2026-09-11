import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface HostLayoutProps {
  children?: ReactNode;
}

export function HostLayout({ children }: HostLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {children ?? <Outlet />}
    </div>
  );
}
