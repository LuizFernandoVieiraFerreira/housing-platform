import { describe, expect, it } from 'vitest';

import { extractBearerToken } from './extract-bearer-token';

describe('extractBearerToken', () => {
  it('returns null when authorization header is missing', () => {
    expect(extractBearerToken({ headers: {} } as never)).toBeNull();
  });

  it('returns null for non-bearer schemes', () => {
    expect(
      extractBearerToken({
        headers: { authorization: 'Basic abc123' },
      } as never),
    ).toBeNull();
  });

  it('returns trimmed bearer token', () => {
    expect(
      extractBearerToken({
        headers: { authorization: 'Bearer  token-value  ' },
      } as never),
    ).toBe('token-value');
  });
});
