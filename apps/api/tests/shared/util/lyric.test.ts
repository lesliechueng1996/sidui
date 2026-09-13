import { describe, expect, it } from 'bun:test';
import {
  findCurrentLyricLineIndex,
  formatLyricTimestamp,
  isLyricColorToken,
  LyricValidationError,
  lyricClockDurationMs,
  normalizeLyricDurationSeconds,
  normalizeLyricSegments,
  normalizeLyricStartMs,
  normalizeOptionalLyricDurationSeconds,
  parseLyricSegments,
  parseLyricSongExportDocument,
  parseLyricTimestamp,
  splitLyricParts,
} from '@api/shared/util/lyric';

describe('splitLyricParts', () => {
  it('splits, trims, and drops empty parts', () => {
    expect(splitLyricParts('君の / 名は')).toEqual(['君の', '名は']);
    expect(splitLyricParts('君の / / 名は /')).toEqual(['君の', '名は']);
  });

  it('returns an empty array for blank input', () => {
    expect(splitLyricParts('')).toEqual([]);
    expect(splitLyricParts('   /  / ')).toEqual([]);
  });
});

describe('parseLyricSegments', () => {
  it('aligns equal japanese and kana parts', () => {
    expect(parseLyricSegments('君の / 名は', 'きみの / なは')).toEqual([
      { text: '君の', kana: 'きみの', color: null },
      { text: '名は', kana: 'なは', color: null },
    ]);
  });

  it('throws when part counts differ', () => {
    expect(() => parseLyricSegments('君の / 名は', 'きみの')).toThrow(
      LyricValidationError,
    );
    expect(() => parseLyricSegments('君の / 名は', 'きみの')).toThrow(
      '日语与假名分段数量不一致',
    );
  });

  it('throws when either side is empty', () => {
    expect(() => parseLyricSegments('', 'きみの')).toThrow('至少需要一个分段');
    expect(() => parseLyricSegments('君の', '  /  ')).toThrow(
      '至少需要一个分段',
    );
  });
});

describe('normalizeLyricSegments', () => {
  it('trims segments and accepts a palette color', () => {
    expect(
      normalizeLyricSegments([
        { text: ' 君の ', kana: ' きみの ', color: 'rose' },
      ]),
    ).toEqual([{ text: '君の', kana: 'きみの', color: 'rose' }]);
  });

  it('rejects empty arrays, blank parts, and invalid colors', () => {
    expect(() => normalizeLyricSegments(null)).toThrow('至少需要一个分段');
    expect(() => normalizeLyricSegments([])).toThrow('至少需要一个分段');
    expect(() =>
      normalizeLyricSegments([{ text: ' ', kana: 'なは', color: null }]),
    ).toThrow('日语与假名分段不能为空');
    expect(() =>
      normalizeLyricSegments([{ text: '名は', kana: 'なは', color: 'red' }]),
    ).toThrow('颜色不正确');
    expect(() => normalizeLyricSegments(['bad'])).toThrow('分段格式不正确');
  });

  it('treats a missing color as null', () => {
    expect(normalizeLyricSegments([{ text: '君の', kana: 'きみの' }])).toEqual([
      { text: '君の', kana: 'きみの', color: null },
    ]);
  });
});

describe('normalizeLyricStartMs', () => {
  it('treats missing values as null and keeps a non-negative integer', () => {
    expect(normalizeLyricStartMs(undefined)).toBeNull();
    expect(normalizeLyricStartMs(null)).toBeNull();
    expect(normalizeLyricStartMs(83450)).toBe(83450);
  });

  it('rejects fractional or negative values', () => {
    expect(() => normalizeLyricStartMs(-1)).toThrow(
      '时间戳必须为大于等于 0 的整数',
    );
    expect(() => normalizeLyricStartMs(1.5)).toThrow(
      '时间戳必须为大于等于 0 的整数',
    );
  });
});

describe('lyric timestamps', () => {
  it('round-trips m:ss.cc and milliseconds', () => {
    expect(parseLyricTimestamp('1:23.45')).toBe(83450);
    expect(formatLyricTimestamp(83450)).toBe('1:23.45');
    expect(parseLyricTimestamp('0:00.00')).toBe(0);
    expect(formatLyricTimestamp(0)).toBe('0:00.00');
  });

  it('returns null for empty or invalid timestamp text', () => {
    expect(parseLyricTimestamp('')).toBeNull();
    expect(parseLyricTimestamp('  ')).toBeNull();
    expect(parseLyricTimestamp('1:99.00')).toBeNull();
    expect(parseLyricTimestamp('1:23')).toBeNull();
  });

  it('formats non-positive values as zero', () => {
    expect(formatLyricTimestamp(-12)).toBe('0:00.00');
    expect(formatLyricTimestamp(Number.NaN)).toBe('0:00.00');
  });
});

describe('isLyricColorToken', () => {
  it('accepts the fixed palette and rejects other strings', () => {
    expect(isLyricColorToken('teal')).toBe(true);
    expect(isLyricColorToken('red')).toBe(false);
  });
});

describe('findCurrentLyricLineIndex', () => {
  const lines = [
    { startMs: 1000 },
    { startMs: null },
    { startMs: 4000 },
    { startMs: 8000 },
  ];

  it('returns null when no timed line has started', () => {
    expect(findCurrentLyricLineIndex(lines, 0)).toBeNull();
    expect(
      findCurrentLyricLineIndex([{ startMs: null }, { startMs: null }], 5000),
    ).toBeNull();
  });

  it('picks the last timed line at or before currentMs', () => {
    expect(findCurrentLyricLineIndex(lines, 1000)).toBe(0);
    expect(findCurrentLyricLineIndex(lines, 3999)).toBe(0);
    expect(findCurrentLyricLineIndex(lines, 4000)).toBe(2);
    expect(findCurrentLyricLineIndex(lines, 9000)).toBe(3);
  });
});

describe('lyricClockDurationMs', () => {
  it('uses the last timed startMs plus 4000, or 0', () => {
    expect(lyricClockDurationMs([{ startMs: null }])).toBe(0);
    expect(
      lyricClockDurationMs([
        { startMs: 1000 },
        { startMs: null },
        { startMs: 8000 },
      ]),
    ).toBe(12000);
  });
});

describe('parseLyricSongExportDocument', () => {
  it('parses a versioned song document', () => {
    expect(
      parseLyricSongExportDocument({
        version: 1,
        songs: [
          {
            title: ' 君の名は ',
            meaning: ' 你的名字 ',
            artist: ' RADWIMPS ',
            lines: [
              {
                segments: [{ text: '君の', kana: 'きみの', color: null }],
                meaning: '你的',
                startMs: 1000,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      version: 1,
      songs: [
        {
          title: '君の名は',
          meaning: '你的名字',
          artist: 'RADWIMPS',
          durationSeconds: null,
          lines: [
            {
              segments: [{ text: '君の', kana: 'きみの', color: null }],
              meaning: '你的',
              startMs: 1000,
            },
          ],
        },
      ],
    });
  });

  it('rejects an unsupported or shapeless document', () => {
    expect(() => parseLyricSongExportDocument(null)).toThrow(
      '导入文件格式不正确',
    );
    expect(() =>
      parseLyricSongExportDocument({ version: 2, songs: [] }),
    ).toThrow('导入文件版本不支持');
    expect(() => parseLyricSongExportDocument({ version: 1 })).toThrow(
      '导入文件缺少歌曲列表',
    );
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [{ title: 1, meaning: '中文' }],
      }),
    ).toThrow('歌曲名不能为空');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [{ title: '   ', meaning: '中文' }],
      }),
    ).toThrow('歌曲名不能为空');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [{ title: '歌', meaning: '   ' }],
      }),
    ).toThrow('中文歌名不能为空');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [{ title: '歌', meaning: '中文', lines: 'nope' }],
      }),
    ).toThrow('歌词行格式不正确');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [
          {
            title: '歌',
            meaning: '中文',
            artist: 1,
            lines: [],
          },
        ],
      }),
    ).toThrow('歌曲字段格式不正确');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [
          {
            title: '歌',
            meaning: '中文',
            lines: ['bad'],
          },
        ],
      }),
    ).toThrow('歌词行格式不正确');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: ['bad'],
      }),
    ).toThrow('歌曲格式不正确');
    expect(() =>
      parseLyricSongExportDocument({
        version: 1,
        songs: [
          {
            title: '歌',
            meaning: '中文',
            durationSeconds: 9,
          },
        ],
      }),
    ).toThrow('歌曲时长须至少 10 秒');
  });
});

describe('normalizeLyricDurationSeconds', () => {
  it('accepts durations of at least 10 seconds', () => {
    expect(normalizeLyricDurationSeconds(10)).toBe(10);
    expect(normalizeOptionalLyricDurationSeconds(undefined)).toBeNull();
    expect(normalizeOptionalLyricDurationSeconds(null)).toBeNull();
    expect(normalizeOptionalLyricDurationSeconds(180)).toBe(180);
    expect(() => normalizeLyricDurationSeconds(9)).toThrow(
      '歌曲时长须至少 10 秒',
    );
    expect(() => normalizeLyricDurationSeconds(10.5)).toThrow(
      '歌曲时长须至少 10 秒',
    );
  });
});
