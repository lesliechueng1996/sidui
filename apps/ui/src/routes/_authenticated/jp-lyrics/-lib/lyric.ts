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

export class LyricValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LyricValidationError';
  }
}

const COLOR_TOKEN_SET = new Set<string>(LYRIC_COLOR_TOKENS);
const TIMESTAMP_PATTERN = /^(\d+):([0-5]\d)\.(\d{2})$/;

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

export const snapToNearestTimedLineMs = (
  lines: Array<{ startMs: number | null }>,
  currentMs: number,
): number => {
  let nearest: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const line of lines) {
    if (line.startMs === null) {
      continue;
    }

    const distance = Math.abs(line.startMs - currentMs);
    if (distance < nearestDistance) {
      nearest = line.startMs;
      nearestDistance = distance;
    }
  }

  return nearest ?? currentMs;
};

export const joinLyricTexts = (segments: LyricSegment[]): string =>
  segments.map((segment) => segment.text).join('');

export const joinLyricKana = (segments: LyricSegment[]): string =>
  segments.map((segment) => segment.kana).join('');

export const joinLyricSource = (parts: string[]): string => parts.join(' / ');

export const nextLyricSegmentKey = (
  seen: Map<string, number>,
  prefix: string,
  segment: Pick<LyricSegment, 'text' | 'kana'>,
): string => {
  const base = `${prefix}-${segment.text}-${segment.kana}`;
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return `${base}-${count}`;
};
