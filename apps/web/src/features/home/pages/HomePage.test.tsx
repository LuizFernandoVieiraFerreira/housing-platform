import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from '@/features/home/pages/HomePage';
import { renderWithProviders } from '@/test/render';

function renderHomePage() {
  return renderWithProviders(<HomePage />);
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the hero headline', () => {
    renderHomePage();

    expect(
      screen.getByRole('heading', { name: /stay for international students/i }),
    ).toBeInTheDocument();
  });

  it('rotates the hero headline every two seconds', () => {
    renderHomePage();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole('heading', { name: /stay for business stay/i }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole('heading', { name: /stay for monthly travelers/i }),
    ).toBeInTheDocument();
  });

  it('renders the featured stays section', () => {
    renderHomePage();

    expect(screen.getByText(/Editor's picks/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Featured stays/i }),
    ).toBeInTheDocument();
  });
});
