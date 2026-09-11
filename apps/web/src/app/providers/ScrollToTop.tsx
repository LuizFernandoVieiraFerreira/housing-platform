import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Client-side navigations keep scroll position by default; reset on every route change. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
