import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  it('scopes profile cache entries by user id', () => {
    expect(queryKeys.profile.current('user-a')).toEqual(['profile', 'current', 'user-a']);
    expect(queryKeys.profile.current('user-b')).toEqual(['profile', 'current', 'user-b']);
  });

  it('builds stable property search keys from filters', () => {
    const filters = { query: 'Hongdae', guests: 2 };
    expect(queryKeys.properties.search(filters)).toEqual(['properties', 'search', filters]);
  });
});
