import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeHeroHeadline } from '@/features/home/components/HomeHeroHeadline';
import { renderWithProviders } from '@/test/render';

function mockPrefersReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('HomeHeroHeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPrefersReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the decorative rotation out of the accessibility tree', () => {
    renderWithProviders(<HomeHeroHeadline />);

    const rotatingLabel = screen.getByText('international students');
    expect(rotatingLabel).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByText('international students, business stay, monthly travelers'),
    ).toHaveClass('sr-only');
  });

  it('does not rotate the visible label when reduced motion is preferred', () => {
    mockPrefersReducedMotion(true);
    renderWithProviders(<HomeHeroHeadline />);

    expect(screen.getByText('international students')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText('international students')).toBeInTheDocument();
    expect(screen.queryByText('business stay')).not.toBeInTheDocument();
  });
});
