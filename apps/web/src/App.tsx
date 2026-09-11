import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import routes from '~react-pages';

/**
 * Main App component using file-based routing.
 * Routes are auto-generated from the pages/ folder by vite-plugin-pages.
 */
export function App() {
  const pageContent = useRoutes(routes);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-ink-muted text-sm">Loading...</p>
        </div>
      }
    >
      {pageContent}
    </Suspense>
  );
}
