import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './Button';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders with accessible loading state', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('aria-busy', 'true');
  });

  it('renders disabled state', () => {
    render(<Button disabled>Submit</Button>);

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
