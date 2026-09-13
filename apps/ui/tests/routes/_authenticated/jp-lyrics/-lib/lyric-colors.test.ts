import { describe, expect, it } from 'vitest';
import { lyricColorClassName } from '@/routes/_authenticated/jp-lyrics/-lib/lyric-colors';

describe('lyric-colors', () => {
  it('maps palette tokens to readable classes and skips null', () => {
    expect(lyricColorClassName('rose')).toContain('bg-rose-200');
    expect(lyricColorClassName('rose')).toContain('px-0.5');
    expect(lyricColorClassName('teal', 'extra')).toContain('extra');
    expect(lyricColorClassName(null)).not.toContain('bg-rose-200');
    expect(lyricColorClassName(null)).not.toContain('px-0.5');
  });
});
