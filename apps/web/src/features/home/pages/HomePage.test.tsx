import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccommodationType } from '@housing-platform/types';

import { HomePage } from '@/features/home/pages/HomePage';
import { expectMapLinkForPropertyType } from '@/test/map-link-contract';
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

  it.each([
    'share-house',
    'studio',
    'micro-studio',
    'multi-bedroom',
  ] as const satisfies readonly AccommodationType[])(
    'links the %s card through canonical map search params',
    (slug) => {
      renderHomePage();
      expectMapLinkForPropertyType(slug);
    },
  );

  it('routes guest highlights to /map without hand-rolled query params', () => {
    renderHomePage();

    const guestLink = screen.getByRole('link', { name: /browse stays/i });
    expect(guestLink.getAttribute('href')).toBe('/map');
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
