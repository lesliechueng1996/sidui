import { describe, expect, it } from 'bun:test';
import { parseAiRuntimeContext } from '@api/infrastructure/external/ai/runtime-context';

describe('parseAiRuntimeContext', () => {
  it('returns a context when userId and feature are non-empty', () => {
    expect(
      parseAiRuntimeContext({
        userId: 'user-1',
        feature: 'lyric-song-base-info',
      }),
    ).toEqual({
      userId: 'user-1',
      feature: 'lyric-song-base-info',
    });
  });

  it('returns null for missing, blank, or non-object values', () => {
    expect(parseAiRuntimeContext(null)).toBeNull();
    expect(parseAiRuntimeContext('user-1')).toBeNull();
    expect(parseAiRuntimeContext({ userId: 'user-1' })).toBeNull();
    expect(
      parseAiRuntimeContext({ userId: '  ', feature: 'lyric-song-base-info' }),
    ).toBeNull();
    expect(parseAiRuntimeContext({ userId: 'user-1', feature: '' })).toBeNull();
  });
});
