import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalPage } from '@/shared/pages/LegalPage';
import { renderWithProviders } from '@/test/render';

describe('LegalPage', () => {
  it.each([
    ['terms', 'Terms & Conditions'],
    ['privacy', 'Privacy Policy'],
    ['refund', 'Refund Policy'],
  ] as const)('renders the %s page', (page, title) => {
    renderWithProviders(<LegalPage page={page} />);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });
});
