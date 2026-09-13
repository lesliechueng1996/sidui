import { describe, expect, it } from 'vitest';
import {
  findCurrentLyricLineIndex,
  formatLyricTimestamp,
  isLyricColorToken,
  joinLyricKana,
  joinLyricSource,
  joinLyricTexts,
  LyricValidationError,
  lyricClockDurationMs,
  parseLyricSegments,
  parseLyricTimestamp,
  snapToNearestTimedLineMs,
  splitLyricParts,
} from '@/routes/_authenticated/jp-lyrics/-lib/lyric';

describe('lyric helpers', () => {
  it('parses aligned parts and rejects mismatches', () => {
    expect(splitLyricParts('君の / / 名は')).toEqual(['君の', '名は']);
    expect(parseLyricSegments('君の / 名は', 'きみの / なは')).toEqual([
      { text: '君の', kana: 'きみの', color: null },
      { text: '名は', kana: 'なは', color: null },
    ]);
    expect(() => parseLyricSegments('君の / 名は', 'きみの')).toThrow(
      LyricValidationError,
    );
    expect(() => parseLyricSegments('', 'なは')).toThrow('至少需要一个分段');
  });

  it('round-trips timestamps and snaps to the nearest timed line', () => {
    expect(parseLyricTimestamp('1:23.45')).toBe(83450);
    expect(formatLyricTimestamp(83450)).toBe('1:23.45');
    expect(parseLyricTimestamp('')).toBeNull();
    expect(parseLyricTimestamp('bad')).toBeNull();
    expect(formatLyricTimestamp(-1)).toBe('0:00.00');
    expect(
      snapToNearestTimedLineMs(
        [{ startMs: 1000 }, { startMs: null }, { startMs: 8000 }],
        3000,
      ),
    ).toBe(1000);
    expect(snapToNearestTimedLineMs([{ startMs: null }], 100)).toBe(100);
  });

  it('finds the current line and clock duration', () => {
    const lines = [{ startMs: 1000 }, { startMs: null }, { startMs: 4000 }];
    expect(findCurrentLyricLineIndex(lines, 0)).toBeNull();
    expect(findCurrentLyricLineIndex(lines, 1500)).toBe(0);
    expect(findCurrentLyricLineIndex(lines, 4000)).toBe(2);
    expect(lyricClockDurationMs(lines)).toBe(8000);
    expect(lyricClockDurationMs([{ startMs: null }])).toBe(0);
    expect(isLyricColorToken('rose')).toBe(true);
    expect(isLyricColorToken('red')).toBe(false);
    expect(
      joinLyricTexts([
        { text: '君', kana: 'きみ', color: null },
        { text: 'の', kana: 'の', color: null },
      ]),
    ).toBe('君の');
    expect(joinLyricKana([{ text: '君', kana: 'きみ', color: null }])).toBe(
      'きみ',
    );
    expect(joinLyricSource(['君の', '名は'])).toBe('君の / 名は');
  });
});
