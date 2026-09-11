import { Button } from '@housing-platform/ui';
import { Link } from 'react-router-dom';

interface RouteErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function RouteErrorFallback({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Refresh the page or try again in a moment.',
  onRetry,
}: RouteErrorFallbackProps) {
  return (
    <section className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-ink text-xl font-semibold">{title}</h1>
      <p className="text-ink-muted mt-2 text-sm">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Link to="/">
          <Button variant={onRetry ? 'secondary' : 'primary'}>Back to home</Button>
        </Link>
      </div>
    </section>
  );
}
