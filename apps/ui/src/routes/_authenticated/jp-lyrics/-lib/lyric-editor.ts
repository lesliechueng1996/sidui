import type { LyricSongDetail } from '@/lib/api/lyric-songs-api';
import {
  formatLyricTimestamp,
  isLyricColorToken,
  joinLyricSource,
  type LyricColorToken,
  type LyricSegment,
  LyricValidationError,
  parseLyricSegments,
  parseLyricTimestamp,
} from './lyric';

export type LyricDraftLine = {
  key: string;
  japanese: string;
  kana: string;
  meaning: string;
  startMsText: string;
  colors: Array<LyricColorToken | null>;
};

export type LyricDraftLineIssue = {
  error: string | null;
  timestampError: string | null;
};

const createDraftKey = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createEmptyDraftLine = (): LyricDraftLine => ({
  key: createDraftKey(),
  japanese: '',
  kana: '',
  meaning: '',
  startMsText: '',
  colors: [],
});

export const duplicateDraftLine = (line: LyricDraftLine): LyricDraftLine => ({
  ...line,
  key: createDraftKey(),
  colors: [...line.colors],
});

export const draftLinesFromSong = (song: LyricSongDetail): LyricDraftLine[] =>
  song.lines.map((line) => ({
    key: line.id,
    japanese: joinLyricSource(line.segments.map((segment) => segment.text)),
    kana: joinLyricSource(line.segments.map((segment) => segment.kana)),
    meaning: line.meaning ?? '',
    startMsText:
      line.startMs === null ? '' : formatLyricTimestamp(line.startMs),
    colors: line.segments.map((segment) =>
      segment.color && isLyricColorToken(segment.color) ? segment.color : null,
    ),
  }));

export const parseDraftLineSegments = (
  line: LyricDraftLine,
): { segments: LyricSegment[]; error: string | null } => {
  try {
    const parsed = parseLyricSegments(line.japanese, line.kana);
    const colors =
      line.colors.length === parsed.length
        ? line.colors
        : parsed.map(() => null);

    return {
      segments: parsed.map((segment, index) => ({
        ...segment,
        color: colors[index] ?? null,
      })),
      error: null,
    };
  } catch (error) {
    return {
      segments: [],
      error:
        error instanceof LyricValidationError
          ? error.message
          : '歌词分段不正确',
    };
  }
};

export const inspectDraftLine = (line: LyricDraftLine): LyricDraftLineIssue => {
  const { error } = parseDraftLineSegments(line);
  const trimmedTime = line.startMsText.trim();
  const timestampError =
    trimmedTime.length > 0 && parseLyricTimestamp(trimmedTime) === null
      ? '时间戳格式应为 m:ss.cc'
      : null;

  return { error, timestampError };
};

export const isDraftLineValid = (line: LyricDraftLine): boolean => {
  const issue = inspectDraftLine(line);
  return issue.error === null && issue.timestampError === null;
};

export const areDraftLinesValid = (lines: LyricDraftLine[]): boolean =>
  lines.every((line) => isDraftLineValid(line));

export const toReplaceLyricLines = (lines: LyricDraftLine[]) =>
  lines.map((line) => {
    const { segments, error } = parseDraftLineSegments(line);
    if (error) {
      throw new LyricValidationError(error);
    }

    const startMs = parseLyricTimestamp(line.startMsText);
    const meaning = line.meaning.trim();

    return {
      segments,
      meaning: meaning.length === 0 ? null : meaning,
      startMs,
    };
  });

export const updateDraftSource = (
  line: LyricDraftLine,
  field: 'japanese' | 'kana',
  value: string,
): LyricDraftLine => {
  const next = { ...line, [field]: value };
  const { segments, error } = parseDraftLineSegments(next);
  return {
    ...next,
    colors: error ? [] : segments.map((segment) => segment.color),
  };
};

export const paintDraftSegments = (
  line: LyricDraftLine,
  start: number,
  end: number,
  color: LyricColorToken | null,
): LyricDraftLine => {
  const { segments, error } = parseDraftLineSegments(line);
  if (error || segments.length === 0) {
    return line;
  }

  const from = Math.max(0, Math.min(start, end));
  const to = Math.min(segments.length - 1, Math.max(start, end));
  const colors = segments.map((segment, index) =>
    index >= from && index <= to ? color : segment.color,
  );

  return { ...line, colors };
};

export const moveDraftLine = (
  lines: LyricDraftLine[],
  from: number,
  to: number,
): LyricDraftLine[] => {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= lines.length ||
    to >= lines.length
  ) {
    return lines;
  }

  const next = [...lines];
  const [moved] = next.splice(from, 1);
  if (!moved) {
    return lines;
  }
  next.splice(to, 0, moved);
  return next;
};

export const bulkPasteJapanese = (text: string): LyricDraftLine[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((japanese) => ({
      ...createEmptyDraftLine(),
      japanese,
    }));

export const selectSegmentRange = (
  current: { start: number; end: number } | null,
  index: number,
): { start: number; end: number } => {
  if (!current) {
    return { start: index, end: index };
  }

  return {
    start: Math.min(current.start, index),
    end: Math.max(current.end, index),
  };
};
