import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { LazyRoute } from '@/shared/components/LazyRoute';

function BrokenPage(): never {
  throw new Error('Render failed');
}

function renderLazyRoute(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LazyRoute', () => {
  it('renders a route-level error fallback when a lazy page throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderLazyRoute(
      <LazyRoute
        loadingFallback={<p>Loading...</p>}
        errorTitle="Unable to load checkout"
        errorDescription="Something went wrong while loading checkout."
      >
        <BrokenPage />
      </LazyRoute>,
    );

    expect(screen.getByRole('heading', { name: 'Unable to load checkout' })).toBeInTheDocument();
    expect(screen.getByText('Something went wrong while loading checkout.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');

    consoleError.mockRestore();
  });

  it('retries rendering after the user clicks try again', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    let shouldThrow = true;

    function MaybeBrokenPage() {
      if (shouldThrow) {
        throw new Error('Render failed');
      }

      return <p>Recovered page</p>;
    }

    renderLazyRoute(
      <LazyRoute loadingFallback={<p>Loading...</p>}>
        <MaybeBrokenPage />
      </LazyRoute>,
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered page')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
