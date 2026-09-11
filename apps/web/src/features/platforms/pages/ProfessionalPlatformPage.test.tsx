import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';
import type { ProfessionalPlatformKey } from '@/features/platforms/lib/professional-platforms';
import { renderWithProviders } from '@/test/render';

describe('ProfessionalPlatformPage', () => {
  it.each([
    {
      platform: 'host' as const,
      title: /list your place and fill it with long-stay guests/i,
      cta: /get started/i,
      comingSoon: false,
    },
    {
      platform: 'photographer' as const,
      title: /shoot the homes that guests book from across the world/i,
      cta: /coming soon/i,
      comingSoon: true,
    },
    {
      platform: 'agent' as const,
      title: /bring your listings to tenants who arrive ready to sign/i,
      cta: /coming soon/i,
      comingSoon: true,
    },
  ] satisfies ReadonlyArray<{
    platform: ProfessionalPlatformKey;
    title: RegExp;
    cta: RegExp;
    comingSoon: boolean;
  }>)(
    'renders the $platform landing with its primary CTA state',
    ({ platform, title, cta, comingSoon }) => {
      renderWithProviders(<ProfessionalPlatformPage platform={platform} />);

      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      expect(screen.getByText(cta)).toBeInTheDocument();

      if (comingSoon) {
        expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
      } else {
        expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute(
          'href',
          '/host/login',
        );
      }
    },
  );

  it('renders platform CTAs as links without nesting interactive elements', () => {
    renderWithProviders(<ProfessionalPlatformPage platform="host" />);

    for (const name of [/get started/i, /log in/i]) {
      const link = screen.getByRole('link', { name });
      expect(link.tagName).toBe('A');
      expect(link.querySelector('button')).toBeNull();
    }

    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/host/signup',
    );
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/host/login');
  });

  it('renders a four-step registration process', () => {
    renderWithProviders(<ProfessionalPlatformPage platform="host" />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });
});
