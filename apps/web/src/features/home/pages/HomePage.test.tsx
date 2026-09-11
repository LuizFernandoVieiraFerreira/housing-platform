import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from '@/features/home/pages/HomePage';
import { parseSearchParams } from '@/features/search/lib/search-params';
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

  it('gives the hero heading a stable accessible name listing every audience', () => {
    renderHomePage();

    const heading = screen.getByRole('heading', {
      name: /stay for international students, business stay, monthly travelers/i,
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Rotating the accessible name would make the heading unreadable with a screen reader.
    expect(heading).toHaveAccessibleName(
      /stay for international students, business stay, monthly travelers/i,
    );
  });

  it('rotates the visible audience label every two seconds', () => {
    renderHomePage();

    expect(screen.getByText('international students')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('business stay')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('monthly travelers')).toBeInTheDocument();
  });

  it('links each accommodation type to a map filter the map actually parses', () => {
    renderHomePage();

    const shareHouseLink = screen.getByRole('link', { name: /share-house/i });
    const search = new URLSearchParams(shareHouseLink.getAttribute('href')?.split('?')[1] ?? '');

    expect(parseSearchParams(search).propertyType).toBe('share-house');
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
