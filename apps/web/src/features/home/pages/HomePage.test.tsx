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
    expect(screen.getByRole('heading', { name: /stay for business stay/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole('heading', { name: /stay for monthly travelers/i }),
    ).toBeInTheDocument();
  });

  it('renders a highlight for every role that uses the platform', () => {
    renderHomePage();

    for (const role of [/For guests/i, /For hosts/i, /For photographers/i, /For agents/i]) {
      expect(screen.getByRole('heading', { name: role })).toBeInTheDocument();
    }
  });

  it('routes each role highlight to its own platform', () => {
    renderHomePage();

    const expectedPaths = ['/map', '/for-hosts', '/for-photographers', '/for-agents'];
    const roleLinks = [
      /browse stays/i,
      /see how hosting works/i,
      /see photographer work/i,
      /see how agents work/i,
    ].map((name) => screen.getByRole('link', { name }));

    expect(roleLinks.map((link) => link.getAttribute('href'))).toEqual(expectedPaths);
  });
});
