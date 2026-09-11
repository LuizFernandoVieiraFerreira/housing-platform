import { Outlet } from 'react-router-dom';

export function HostLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Outlet />
    </div>
  );
}
