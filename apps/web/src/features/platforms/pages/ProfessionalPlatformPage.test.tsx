import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfessionalPlatformPage } from '@/features/platforms/pages/ProfessionalPlatformPage';
import { renderWithProviders } from '@/test/render';

describe('ProfessionalPlatformPage', () => {
  it('sends hosts to the host platform login and signup', () => {
    renderWithProviders(<ProfessionalPlatformPage platform="host" />);

    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/host/signup',
    );
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/host/login');
  });

  it('invites interest instead of a login while a platform has no login page yet', () => {
    renderWithProviders(<ProfessionalPlatformPage platform="photographer" />);

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
  });

  it('renders a four-step registration process', () => {
    renderWithProviders(<ProfessionalPlatformPage platform="host" />);

    // The stepper has 4 numbered steps
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });
});
