import { logger } from '@api/infrastructure/logger';
import { lyricLineRepository } from '@api/infrastructure/repository/lyric-line-repository';
import { lyricSongRepository } from '@api/infrastructure/repository/lyric-song-repository';
import type {
  CreateLyricSongBody,
  ImportLyricSongsResponse,
  LyricLine,
  LyricSongDetail,
  LyricSongExportDocument,
  LyricSongListItem,
  ReplaceLyricLinesBody,
  UpdateLyricLineTimingsBody,
  UpdateLyricSongBody,
} from '@api/interface/schema/lyric-song-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import {
  LYRIC_SONG_EXPORT_VERSION,
  type LyricSegment,
  type LyricSongExportItem,
  LyricValidationError,
  normalizeLyricDurationSeconds,
  normalizeLyricSegments,
  normalizeLyricStartMs,
  parseLyricSongExportItem,
  parseLyricSongExportSongs,
} from '@api/shared/util/lyric';

type LyricSongRow = NonNullable<
  Awaited<ReturnType<typeof lyricSongRepository.findById>>
>;
type LyricLineRow = Awaited<
  ReturnType<typeof lyricLineRepository.listBySongId>
>[number];
type LyricSongListRow = Awaited<
  ReturnType<typeof lyricSongRepository.listByUserId>
>[number];

const SONG_NOT_FOUND_MESSAGE = '歌曲不存在';

const normalizeRequiredText = (value: string, message: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException(message);
  }
  return trimmed;
};

const normalizeArtist = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeLineMeaning = (
  value: string | null | undefined,
): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const mapLyricValidationError = (error: unknown): never => {
  if (error instanceof LyricValidationError) {
    throw new BadRequestException(
      error.message,
      ERROR_CODES.LYRIC_LINE_INVALID,
    );
  }
  throw error;
};

const toLyricLine = (row: LyricLineRow): LyricLine => ({
  id: row.id,
  position: row.position,
  segments: row.segments,
  meaning: row.meaning,
  startMs: row.startMs,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const toLyricSongListItem = (row: LyricSongListRow): LyricSongListItem => ({
  id: row.id,
  title: row.title,
  meaning: row.meaning,
  artist: row.artist,
  durationSeconds: row.durationSeconds,
  lineCount: Number(row.lineCount),
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const toLyricSongDetail = (
  song: LyricSongRow,
  lines: LyricLineRow[],
): LyricSongDetail => ({
  id: song.id,
  title: song.title,
  meaning: song.meaning,
  artist: song.artist,
  durationSeconds: song.durationSeconds,
  createdAt: formatDateTime(song.createdAt),
  updatedAt: formatDateTime(song.updatedAt),
  lines: lines.map(toLyricLine),
});

const findOwnedSongOrThrow = async (
  userId: string,
  songId: string,
): Promise<LyricSongRow> => {
  const song = await lyricSongRepository.findById(songId);
  if (!song || song.userId !== userId) {
    throw new NotFoundException(
      SONG_NOT_FOUND_MESSAGE,
      ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    );
  }
  return song;
};

const normalizeReplaceLines = (lines: ReplaceLyricLinesBody['lines']) => {
  try {
    return lines.map((line, position) => ({
      position,
      segments: normalizeLyricSegments(line.segments),
      meaning: normalizeLineMeaning(line.meaning),
      startMs: normalizeLyricStartMs(line.startMs),
    }));
  } catch (error) {
    return mapLyricValidationError(error);
  }
};

const loadSongDetail = async (song: LyricSongRow): Promise<LyricSongDetail> => {
  const lines = await lyricLineRepository.listBySongId(song.id);
  return toLyricSongDetail(song, lines);
};

export const listLyricSongs = async (
  userId: string,
): Promise<LyricSongListItem[]> => {
  const rows = await lyricSongRepository.listByUserId(userId);
  return rows.map(toLyricSongListItem);
};

export const createLyricSong = async (
  userId: string,
  body: CreateLyricSongBody,
): Promise<LyricSongDetail> => {
  const title = normalizeRequiredText(body.title, '歌曲名不能为空');
  const meaning = normalizeRequiredText(body.meaning, '中文歌名不能为空');
  let durationSeconds: number;
  try {
    durationSeconds = normalizeLyricDurationSeconds(body.durationSeconds);
  } catch (error) {
    return mapLyricValidationError(error);
  }

  try {
    const created = await lyricSongRepository.create({
      userId,
      title,
      meaning,
      artist: normalizeArtist(body.artist),
      durationSeconds,
    });
    logger.info('Created lyric song {songId} for user {userId}', {
      songId: created.id,
      userId,
    });
    return toLyricSongDetail(created, []);
  } catch (error) {
    logger.error('Create lyric song failed, {userId}, {error}', {
      userId,
      error,
    });
    throw error;
  }
};

export const getLyricSong = async (
  userId: string,
  songId: string,
): Promise<LyricSongDetail> => {
  const song = await findOwnedSongOrThrow(userId, songId);
  return loadSongDetail(song);
};

export const updateLyricSong = async (
  userId: string,
  songId: string,
  body: UpdateLyricSongBody,
): Promise<LyricSongDetail> => {
  await findOwnedSongOrThrow(userId, songId);

  const values: Parameters<typeof lyricSongRepository.updateById>[1] = {};

  if (body.title !== undefined) {
    values.title = normalizeRequiredText(body.title, '歌曲名不能为空');
  }

  if (body.meaning !== undefined) {
    values.meaning = normalizeRequiredText(body.meaning, '中文歌名不能为空');
  }

  if (body.artist !== undefined) {
    values.artist = normalizeArtist(body.artist);
  }

  if (body.durationSeconds !== undefined) {
    try {
      values.durationSeconds = normalizeLyricDurationSeconds(
        body.durationSeconds,
      );
    } catch (error) {
      return mapLyricValidationError(error);
    }
  }

  try {
    const updated = await lyricSongRepository.updateById(songId, values);
    if (!updated) {
      throw new NotFoundException(
        SONG_NOT_FOUND_MESSAGE,
        ERROR_CODES.LYRIC_SONG_NOT_FOUND,
      );
    }
    logger.info('Updated lyric song {songId} for user {userId}', {
      songId,
      userId,
    });
    return loadSongDetail(updated);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    logger.error('Update lyric song failed, {songId}, {error}', {
      songId,
      error,
    });
    throw error;
  }
};

export const deleteLyricSong = async (
  userId: string,
  songId: string,
): Promise<void> => {
  await findOwnedSongOrThrow(userId, songId);

  try {
    await lyricSongRepository.deleteWithLines(songId);
    logger.info('Deleted lyric song {songId} for user {userId}', {
      songId,
      userId,
    });
  } catch (error) {
    logger.error('Delete lyric song failed, {songId}, {error}', {
      songId,
      error,
    });
    throw error;
  }
};

export const replaceLyricLines = async (
  userId: string,
  songId: string,
  body: ReplaceLyricLinesBody,
): Promise<LyricSongDetail> => {
  const song = await findOwnedSongOrThrow(userId, songId);
  const lines = normalizeReplaceLines(body.lines);

  try {
    await lyricLineRepository.replaceBySongId(songId, lines);
    logger.info(
      'Replaced lyric lines for song {songId} with {lineCount} lines',
      {
        songId,
        lineCount: lines.length,
      },
    );
    return loadSongDetail(song);
  } catch (error) {
    logger.error('Replace lyric lines failed, {songId}, {error}', {
      songId,
      error,
    });
    throw error;
  }
};

export const updateLyricLineTimings = async (
  userId: string,
  songId: string,
  body: UpdateLyricLineTimingsBody,
): Promise<LyricSongDetail> => {
  const song = await findOwnedSongOrThrow(userId, songId);
  const existingIds = new Set(
    (await lyricLineRepository.listIdsBySongId(songId)).map((row) => row.id),
  );

  for (const timing of body.timings) {
    if (!existingIds.has(timing.lineId)) {
      throw new BadRequestException(
        '歌词行不属于该歌曲',
        ERROR_CODES.LYRIC_LINE_INVALID,
      );
    }
  }

  try {
    await lyricLineRepository.updateTimings(songId, body.timings);
    logger.info('Updated lyric line timings for song {songId}', { songId });
    return loadSongDetail(song);
  } catch (error) {
    logger.error('Update lyric line timings failed, {songId}, {error}', {
      songId,
      error,
    });
    throw error;
  }
};

const toExportLine = (line: LyricLineRow) => ({
  segments: line.segments as LyricSegment[],
  meaning: line.meaning,
  startMs: line.startMs,
});

export const exportLyricSongs = async (
  userId: string,
): Promise<LyricSongExportDocument> => {
  const songs = await lyricSongRepository.listOwnedByUserId(userId);
  const lines = await lyricLineRepository.listBySongIds(
    songs.map((song) => song.id),
  );
  const linesBySongId = new Map<string, LyricLineRow[]>();

  for (const line of lines) {
    const current = linesBySongId.get(line.songId) ?? [];
    current.push(line);
    linesBySongId.set(line.songId, current);
  }

  return {
    version: LYRIC_SONG_EXPORT_VERSION,
    songs: songs.map((song) => ({
      title: song.title,
      meaning: song.meaning,
      artist: song.artist,
      durationSeconds: song.durationSeconds,
      lines: (linesBySongId.get(song.id) ?? []).map(toExportLine),
    })),
  };
};

const importErrorTitle = (value: unknown): string => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0
  ) {
    return value.title.trim();
  }
  return '';
};

const writeImportedSong = async (userId: string, song: LyricSongExportItem) => {
  const existing = await lyricSongRepository.findByUserIdAndTitle(
    userId,
    song.title,
  );
  if (existing) {
    return 'skipped' as const;
  }

  await lyricSongRepository.createWithLines(
    {
      userId,
      title: song.title,
      meaning: song.meaning,
      artist: song.artist,
      durationSeconds: song.durationSeconds,
    },
    song.lines.map((line, position) => ({
      position,
      segments: line.segments,
      meaning: line.meaning,
      startMs: line.startMs,
    })),
  );
  return 'created' as const;
};

export const importLyricSongsFromJsonFile = async (
  userId: string,
  file: File,
): Promise<ImportLyricSongsResponse> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BadRequestException(
      '导入文件不是有效的 JSON',
      ERROR_CODES.LYRIC_SONG_IMPORT_INVALID,
    );
  }

  let rawSongs: unknown[];
  try {
    rawSongs = parseLyricSongExportSongs(parsed);
  } catch (error) {
    if (error instanceof LyricValidationError) {
      throw new BadRequestException(
        error.message,
        ERROR_CODES.LYRIC_SONG_IMPORT_INVALID,
      );
    }
    throw error;
  }

  const result: ImportLyricSongsResponse = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const [index, rawSong] of rawSongs.entries()) {
    try {
      const song = parseLyricSongExportItem(rawSong);
      const status = await writeImportedSong(userId, song);
      if (status === 'skipped') {
        result.skipped += 1;
      } else {
        result.created += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        index,
        title: importErrorTitle(rawSong),
        message:
          error instanceof LyricValidationError ||
          error instanceof BadRequestException
            ? error.message
            : '导入失败',
      });
    }
  }

  logger.info(
    'Imported lyric songs for user {userId}: created {created}, skipped {skipped}, failed {failed}',
    {
      userId,
      created: result.created,
      skipped: result.skipped,
      failed: result.failed,
    },
  );

  return result;
};
