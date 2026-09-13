export const LYRIC_COLOR_TOKENS = [
  'rose',
  'amber',
  'lime',
  'sky',
  'violet',
  'pink',
  'orange',
  'teal',
] as const;

export type LyricColorToken = (typeof LYRIC_COLOR_TOKENS)[number];

export type LyricSegment = {
  text: string;
  kana: string;
  color: LyricColorToken | null;
};

export const LYRIC_SONG_EXPORT_VERSION = 1;

export const MIN_LYRIC_DURATION_SECONDS = 10;

export class LyricValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LyricValidationError';
  }
}

const COLOR_TOKEN_SET = new Set<string>(LYRIC_COLOR_TOKENS);
const TIMESTAMP_PATTERN = /^(\d+):([0-5]\d)\.(\d{2})$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const splitLyricParts = (raw: string): string[] =>
  raw
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

export const isLyricColorToken = (value: string): value is LyricColorToken =>
  COLOR_TOKEN_SET.has(value);

export const parseLyricSegments = (
  japanese: string,
  kana: string,
): LyricSegment[] => {
  const texts = splitLyricParts(japanese);
  const kanaParts = splitLyricParts(kana);

  if (texts.length === 0 || kanaParts.length === 0) {
    throw new LyricValidationError('至少需要一个分段');
  }

  if (texts.length !== kanaParts.length) {
    throw new LyricValidationError('日语与假名分段数量不一致');
  }

  return texts.map((text, index) => ({
    text,
    kana: kanaParts[index] as string,
    color: null,
  }));
};

export const normalizeLyricColor = (value: unknown): LyricColorToken | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !isLyricColorToken(value)) {
    throw new LyricValidationError('颜色不正确');
  }

  return value;
};

export const normalizeLyricSegments = (value: unknown): LyricSegment[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new LyricValidationError('至少需要一个分段');
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new LyricValidationError('分段格式不正确');
    }

    const text = typeof item.text === 'string' ? item.text.trim() : '';
    const kana = typeof item.kana === 'string' ? item.kana.trim() : '';

    if (text.length === 0 || kana.length === 0) {
      throw new LyricValidationError('日语与假名分段不能为空');
    }

    return {
      text,
      kana,
      color: normalizeLyricColor(item.color),
    };
  });
};

export const normalizeLyricStartMs = (value: unknown): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new LyricValidationError('时间戳必须为大于等于 0 的整数');
  }

  return value;
};

export const normalizeLyricDurationSeconds = (value: unknown): number => {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < MIN_LYRIC_DURATION_SECONDS
  ) {
    throw new LyricValidationError('歌曲时长须至少 10 秒');
  }

  return value;
};

export const normalizeOptionalLyricDurationSeconds = (
  value: unknown,
): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeLyricDurationSeconds(value);
};

export const parseLyricTimestamp = (text: string): number | null => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const match = TIMESTAMP_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const centiseconds = Number(match[3]);

  return minutes * 60_000 + seconds * 1000 + centiseconds * 10;
};

export const formatLyricTimestamp = (ms: number): string => {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalCentiseconds = Math.round(safeMs / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const remainder = totalCentiseconds % 6000;
  const seconds = Math.floor(remainder / 100);
  const centiseconds = remainder % 100;

  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

export const findCurrentLyricLineIndex = (
  lines: Array<{ startMs: number | null }>,
  currentMs: number,
): number | null => {
  let currentIndex: number | null = null;

  for (const [index, line] of lines.entries()) {
    if (line.startMs !== null && line.startMs <= currentMs) {
      currentIndex = index;
    }
  }

  return currentIndex;
};

export const lyricClockDurationMs = (
  lines: Array<{ startMs: number | null }>,
): number => {
  let lastStartMs: number | null = null;

  for (const line of lines) {
    if (line.startMs !== null) {
      lastStartMs = line.startMs;
    }
  }

  return lastStartMs === null ? 0 : lastStartMs + 4000;
};

export type LyricSongExportLine = {
  segments: LyricSegment[];
  meaning: string | null;
  startMs: number | null;
};

export type LyricSongExportItem = {
  title: string;
  meaning: string;
  artist: string | null;
  durationSeconds: number | null;
  lines: LyricSongExportLine[];
};

export type LyricSongExportDocument = {
  version: typeof LYRIC_SONG_EXPORT_VERSION;
  songs: LyricSongExportItem[];
};

const normalizeNullableText = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new LyricValidationError('歌曲字段格式不正确');
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeRequiredText = (value: unknown, message: string): string => {
  if (typeof value !== 'string') {
    throw new LyricValidationError(message);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new LyricValidationError(message);
  }

  return trimmed;
};

export const parseLyricSongExportLine = (
  value: unknown,
): LyricSongExportLine => {
  if (!isRecord(value)) {
    throw new LyricValidationError('歌词行格式不正确');
  }

  return {
    segments: normalizeLyricSegments(value.segments),
    meaning: normalizeNullableText(value.meaning),
    startMs: normalizeLyricStartMs(value.startMs),
  };
};

export const parseLyricSongExportItem = (
  value: unknown,
): LyricSongExportItem => {
  if (!isRecord(value)) {
    throw new LyricValidationError('歌曲格式不正确');
  }

  const linesValue = value.lines;
  if (linesValue !== undefined && !Array.isArray(linesValue)) {
    throw new LyricValidationError('歌词行格式不正确');
  }

  return {
    title: normalizeRequiredText(value.title, '歌曲名不能为空'),
    meaning: normalizeRequiredText(value.meaning, '中文歌名不能为空'),
    artist: normalizeNullableText(value.artist),
    durationSeconds: normalizeOptionalLyricDurationSeconds(
      value.durationSeconds,
    ),
    lines: (linesValue ?? []).map(parseLyricSongExportLine),
  };
};

export const parseLyricSongExportSongs = (value: unknown): unknown[] => {
  if (!isRecord(value)) {
    throw new LyricValidationError('导入文件格式不正确');
  }

  if (value.version !== LYRIC_SONG_EXPORT_VERSION) {
    throw new LyricValidationError('导入文件版本不支持');
  }

  if (!Array.isArray(value.songs)) {
    throw new LyricValidationError('导入文件缺少歌曲列表');
  }

  return value.songs;
};

export const parseLyricSongExportDocument = (
  value: unknown,
): LyricSongExportDocument => ({
  version: LYRIC_SONG_EXPORT_VERSION,
  songs: parseLyricSongExportSongs(value).map(parseLyricSongExportItem),
});
