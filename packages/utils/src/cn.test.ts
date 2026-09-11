import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles conditional class values', () => {
    const includeHidden = false;
    expect(cn('text-ink', includeHidden && 'hidden', 'font-bold')).toBe('text-ink font-bold');
  });
});
