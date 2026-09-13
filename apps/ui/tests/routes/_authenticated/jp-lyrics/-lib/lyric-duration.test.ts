import { describe, expect, it } from 'vitest';
import {
  formatLyricDurationLabel,
  isLyricDurationValid,
  lyricDurationPartsFromSeconds,
  lyricDurationSecondsFromParts,
} from '@/routes/_authenticated/jp-lyrics/-lib/lyric-duration';

describe('lyric-duration', () => {
  it('converts minutes and seconds to a total', () => {
    expect(lyricDurationSecondsFromParts('3', '25')).toBe(205);
    expect(lyricDurationSecondsFromParts('', '10')).toBe(10);
    expect(lyricDurationSecondsFromParts('1', '')).toBe(60);
    expect(lyricDurationSecondsFromParts('1', '60')).toBeNull();
    expect(lyricDurationSecondsFromParts('-1', '0')).toBeNull();
    expect(lyricDurationSecondsFromParts('1.5', '0')).toBeNull();
  });

  it('splits seconds and formats labels', () => {
    expect(lyricDurationPartsFromSeconds(205)).toEqual({
      minutes: '3',
      seconds: '25',
    });
    expect(lyricDurationPartsFromSeconds(null)).toEqual({
      minutes: '',
      seconds: '',
    });
    expect(lyricDurationPartsFromSeconds(-1)).toEqual({
      minutes: '',
      seconds: '',
    });
    expect(formatLyricDurationLabel(205)).toBe('3 分 25 秒');
    expect(formatLyricDurationLabel(null)).toBe('未填写时长');
    expect(isLyricDurationValid(10)).toBe(true);
    expect(isLyricDurationValid(9)).toBe(false);
    expect(isLyricDurationValid(null)).toBe(false);
  });
});
