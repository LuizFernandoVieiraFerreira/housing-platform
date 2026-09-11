import { buildFaviconSvg } from '@housing-platform/config/design-tokens/favicon-svg';
import { describe, expect, it } from 'vitest';

describe('buildFaviconSvg', () => {
  it('uses the provided brand color for the house roof', () => {
    const svg = buildFaviconSvg('#3b82f6');

    expect(svg).toContain('fill="#3b82f6"');
    expect(svg).toContain('stroke="#3b82f6"');
    expect(svg).not.toContain('#408AF5');
  });
});
