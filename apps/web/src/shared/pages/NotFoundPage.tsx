import { Link } from 'react-router-dom';
import { Button } from '@housing-platform/ui';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-brand-600 text-sm font-semibold uppercase tracking-wide">404</p>
      <h1 className="text-ink mt-2 text-3xl font-bold">Page not found</h1>
      <p className="text-ink-muted mt-3">The page you are looking for does not exist yet.</p>
      <Link to="/" className="mt-6 inline-flex">
        <Button>Back to home</Button>
      </Link>
    </section>
  );
}
