import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomeRolesSection } from '@/features/home/components/HomeRolesSection';
import { renderWithProviders } from '@/test/render';

describe('HomeRolesSection', () => {
  it('routes guests to the map using a plain link', () => {
    renderWithProviders(<HomeRolesSection />);

    const guestLink = screen.getByRole('link', { name: /browse stays/i });
    expect(guestLink.getAttribute('href')).toBe('/map');
    expect(guestLink.querySelector('button')).toBeNull();
  });

  it('routes professional roles to their landing pages', () => {
    renderWithProviders(<HomeRolesSection />);

    expect(screen.getByRole('link', { name: /see how hosting works/i })).toHaveAttribute(
      'href',
      '/for-hosts',
    );
    expect(screen.getByRole('link', { name: /see photographer work/i })).toHaveAttribute(
      'href',
      '/for-photographers',
    );
    expect(screen.getByRole('link', { name: /see how agents work/i })).toHaveAttribute(
      'href',
      '/for-agents',
    );
  });

  it('does not hand-roll map query params for guest navigation', () => {
    renderWithProviders(<HomeRolesSection />);

    const guestLink = screen.getByRole('link', { name: /browse stays/i });
    expect(guestLink.getAttribute('href')).not.toContain('?');
  });
});
