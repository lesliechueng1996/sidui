import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateLyricSongBody,
  ReplaceLyricLinesBody,
  UpdateLyricLineTimingsBody,
  UpdateLyricSongBody,
} from '@api/interface/schema/lyric-song-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import type { LyricSegment } from '@api/shared/util/lyric';

const userId = 'user-1';
const otherUserId = 'user-2';
const songId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const lineId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const segments: LyricSegment[] = [
  { text: '君の', kana: 'きみの', color: null },
];

type SongRow = {
  id: string;
  userId: string;
  title: string;
  meaning: string;
  artist: string | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type LineRow = {
  id: string;
  songId: string;
  position: number;
  segments: LyricSegment[];
  meaning: string | null;
  startMs: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type ListRow = {
  id: string;
  title: string;
  meaning: string;
  artist: string | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  lineCount: number | string;
};

const songRow = (overrides: Partial<SongRow> = {}): SongRow => ({
  id: songId,
  userId,
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  durationSeconds: 205,
  createdAt,
  updatedAt,
  ...overrides,
});

const lineRow = (overrides: Partial<LineRow> = {}): LineRow => ({
  id: lineId,
  songId,
  position: 0,
  segments,
  meaning: '你的',
  startMs: 1000,
  createdAt,
  updatedAt,
  ...overrides,
});

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const listByUserId = mock(async (_id: string) => [] as ListRow[]);
const listOwnedByUserId = mock(async (_id: string) => [] as SongRow[]);
const findById = mock(async (_id: string) => null as SongRow | null);
const findByUserIdAndTitle = mock(
  async (_userId: string, _title: string) => null as SongRow | null,
);
const create = mock(async (_values: unknown) => songRow());
const createWithLines = mock(async (_values: unknown, _lines: unknown) =>
  songRow(),
);
const updateById = mock(
  async (_id: string, _values: unknown) => null as SongRow | null,
);
const deleteWithLines = mock(async (_id: string) => undefined);
const listBySongId = mock(async (_id: string) => [] as LineRow[]);
const listBySongIds = mock(async (_ids: string[]) => [] as LineRow[]);
const listIdsBySongId = mock(
  async (_id: string) => [] as Array<{ id: string }>,
);
const replaceBySongId = mock(async (_id: string, _lines: unknown) => undefined);
const updateTimings = mock(async (_id: string, _timings: unknown) => undefined);
const formatDateTime = mock((date: Date) => `fmt:${date.toISOString()}`);

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module('@api/infrastructure/repository/lyric-song-repository', () => ({
  lyricSongRepository: {
    listByUserId,
    listOwnedByUserId,
    findById,
    findByUserIdAndTitle,
    create,
    createWithLines,
    updateById,
    deleteWithLines,
  },
}));
mock.module('@api/infrastructure/repository/lyric-line-repository', () => ({
  lyricLineRepository: {
    listBySongId,
    listBySongIds,
    listIdsBySongId,
    replaceBySongId,
    updateTimings,
  },
}));
mock.module('@api/shared/util/date', () => ({ formatDateTime }));

const {
  listLyricSongs,
  createLyricSong,
  getLyricSong,
  updateLyricSong,
  deleteLyricSong,
  replaceLyricLines,
  updateLyricLineTimings,
  exportLyricSongs,
  importLyricSongsFromJsonFile,
} = await import('@api/application/service/lyric-song-service');

const createBody = (
  overrides: Partial<CreateLyricSongBody> = {},
): CreateLyricSongBody => ({
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  durationSeconds: 205,
  ...overrides,
});

const replaceBody = (
  overrides: Partial<ReplaceLyricLinesBody> = {},
): ReplaceLyricLinesBody => ({
  lines: [
    {
      segments,
      meaning: '你的',
      startMs: 1000,
    },
  ],
  ...overrides,
});

const timingsBody = (
  overrides: Partial<UpdateLyricLineTimingsBody> = {},
): UpdateLyricLineTimingsBody => ({
  timings: [{ lineId, startMs: 2000 }],
  ...overrides,
});

const jsonFile = (value: unknown) =>
  new File([JSON.stringify(value)], 'lyric-songs.json', {
    type: 'application/json',
  });

describe('lyric-song-service', () => {
  beforeEach(() => {
    listByUserId.mockReset();
    listOwnedByUserId.mockReset();
    findById.mockReset();
    findByUserIdAndTitle.mockReset();
    create.mockReset();
    createWithLines.mockReset();
    updateById.mockReset();
    deleteWithLines.mockReset();
    listBySongId.mockReset();
    listBySongIds.mockReset();
    listIdsBySongId.mockReset();
    replaceBySongId.mockReset();
    updateTimings.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    formatDateTime.mockClear();

    listByUserId.mockResolvedValue([]);
    listOwnedByUserId.mockResolvedValue([]);
    findById.mockResolvedValue(null);
    findByUserIdAndTitle.mockResolvedValue(null);
    create.mockResolvedValue(songRow());
    createWithLines.mockResolvedValue(songRow());
    updateById.mockResolvedValue(songRow());
    deleteWithLines.mockResolvedValue(undefined);
    listBySongId.mockResolvedValue([]);
    listBySongIds.mockResolvedValue([]);
    listIdsBySongId.mockResolvedValue([{ id: lineId }]);
    replaceBySongId.mockResolvedValue(undefined);
    updateTimings.mockResolvedValue(undefined);
  });

  it('lists the current user’s songs', async () => {
    listByUserId.mockResolvedValue([
      {
        id: songId,
        title: '君の名は',
        meaning: '你的名字',
        artist: 'RADWIMPS',
        durationSeconds: 205,
        createdAt,
        updatedAt,
        lineCount: '2',
      },
    ]);

    await expect(listLyricSongs(userId)).resolves.toEqual([
      {
        id: songId,
        title: '君の名は',
        meaning: '你的名字',
        artist: 'RADWIMPS',
        durationSeconds: 205,
        lineCount: 2,
        createdAt: 'fmt:2026-01-01T00:00:00.000Z',
        updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
      },
    ]);
    expect(listByUserId).toHaveBeenCalledWith(userId);
  });

  it('creates a song for the session user', async () => {
    const result = await createLyricSong(
      userId,
      createBody({ title: ' 君の名は ', meaning: ' 你的名字 ', artist: '  ' }),
    );

    expect(create).toHaveBeenCalledWith({
      userId,
      title: '君の名は',
      meaning: '你的名字',
      artist: null,
      durationSeconds: 205,
    });
    expect(result.lines).toEqual([]);
    expect(logger.info).toHaveBeenCalled();
  });

  it('creates a song when artist is omitted', async () => {
    await createLyricSong(userId, {
      title: 'スパークル',
      meaning: '火花',
      durationSeconds: 205,
    });

    expect(create).toHaveBeenCalledWith({
      userId,
      title: 'スパークル',
      meaning: '火花',
      artist: null,
      durationSeconds: 205,
    });
  });

  it('rejects a short duration on create', async () => {
    await expect(
      createLyricSong(userId, createBody({ durationSeconds: 9 })),
    ).rejects.toMatchObject({
      message: '歌曲时长须至少 10 秒',
      statusCode: 400,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a blank title or meaning on create', async () => {
    await expect(
      createLyricSong(userId, createBody({ title: '   ' })),
    ).rejects.toMatchObject({
      message: '歌曲名不能为空',
      statusCode: 400,
    });
    await expect(
      createLyricSong(userId, createBody({ meaning: '   ' })),
    ).rejects.toMatchObject({
      message: '中文歌名不能为空',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('logs and rethrows create failures', async () => {
    create.mockRejectedValue(new Error('db'));

    await expect(createLyricSong(userId, createBody())).rejects.toThrow('db');
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns an owned song with lines', async () => {
    findById.mockResolvedValue(songRow());
    listBySongId.mockResolvedValue([lineRow()]);

    const result = await getLyricSong(userId, songId);

    expect(result.id).toBe(songId);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.segments).toEqual(segments);
  });

  it('hides another user’s song as not found', async () => {
    findById.mockResolvedValue(songRow({ userId: otherUserId }));

    await expect(getLyricSong(userId, songId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(getLyricSong(userId, songId)).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    });
  });

  it('updates title, meaning, and artist', async () => {
    findById.mockResolvedValue(songRow());
    updateById.mockResolvedValue(songRow({ title: 'スパークル' }));
    listBySongId.mockResolvedValue([]);

    const body: UpdateLyricSongBody = {
      title: ' スパークル ',
      meaning: ' 火花 ',
      artist: 'RADWIMPS',
    };

    await updateLyricSong(userId, songId, body);

    expect(updateById).toHaveBeenCalledWith(songId, {
      title: 'スパークル',
      meaning: '火花',
      artist: 'RADWIMPS',
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it('updates only the provided song fields', async () => {
    findById.mockResolvedValue(songRow());
    listBySongId.mockResolvedValue([]);

    await updateLyricSong(userId, songId, { meaning: '火花' });

    expect(updateById).toHaveBeenCalledWith(songId, { meaning: '火花' });

    await updateLyricSong(userId, songId, { durationSeconds: 180 });
    expect(updateById).toHaveBeenCalledWith(songId, { durationSeconds: 180 });
  });

  it('rejects a short duration on update', async () => {
    findById.mockResolvedValue(songRow());

    await expect(
      updateLyricSong(userId, songId, { durationSeconds: 9 }),
    ).rejects.toMatchObject({
      message: '歌曲时长须至少 10 秒',
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects a blank title on update and a vanished row', async () => {
    findById.mockResolvedValue(songRow());

    await expect(
      updateLyricSong(userId, songId, { title: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      updateLyricSong(userId, songId, { meaning: '  ' }),
    ).rejects.toMatchObject({
      message: '中文歌名不能为空',
    });

    updateById.mockResolvedValue(null);
    await expect(
      updateLyricSong(userId, songId, { artist: null }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs unexpected update failures', async () => {
    findById.mockResolvedValue(songRow());
    updateById.mockRejectedValue(new Error('db'));

    await expect(
      updateLyricSong(userId, songId, { artist: null }),
    ).rejects.toThrow('db');
    expect(logger.error).toHaveBeenCalled();
  });

  it('deletes an owned song and logs unexpected delete failures', async () => {
    findById.mockResolvedValue(songRow());

    await deleteLyricSong(userId, songId);
    expect(deleteWithLines).toHaveBeenCalledWith(songId);

    deleteWithLines.mockRejectedValue(new Error('db'));
    await expect(deleteLyricSong(userId, songId)).rejects.toThrow('db');
    expect(logger.error).toHaveBeenCalled();
  });

  it('does not delete another user’s song', async () => {
    findById.mockResolvedValue(null);

    await expect(deleteLyricSong(userId, songId)).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    });
    expect(deleteWithLines).not.toHaveBeenCalled();
  });

  it('replaces lines and allows an empty document', async () => {
    findById.mockResolvedValue(songRow());
    listBySongId.mockResolvedValue([lineRow()]);

    const result = await replaceLyricLines(userId, songId, replaceBody());

    expect(replaceBySongId).toHaveBeenCalledWith(songId, [
      {
        position: 0,
        segments,
        meaning: '你的',
        startMs: 1000,
      },
    ]);
    expect(result.lines).toHaveLength(1);

    await replaceLyricLines(userId, songId, { lines: [] });
    expect(replaceBySongId).toHaveBeenCalledWith(songId, []);

    await replaceLyricLines(userId, songId, {
      lines: [{ segments, meaning: null }],
    });
    expect(replaceBySongId).toHaveBeenLastCalledWith(songId, [
      {
        position: 0,
        segments,
        meaning: null,
        startMs: null,
      },
    ]);

    await replaceLyricLines(userId, songId, {
      lines: [{ segments, meaning: '  ' }],
    });
    expect(replaceBySongId).toHaveBeenLastCalledWith(songId, [
      {
        position: 0,
        segments,
        meaning: null,
        startMs: null,
      },
    ]);
  });

  it('rejects invalid segments or colors when replacing lines', async () => {
    findById.mockResolvedValue(songRow());

    await expect(
      replaceLyricLines(userId, songId, {
        lines: [
          {
            segments: [{ text: '君の', kana: 'きみの', color: 'red' as never }],
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_LINE_INVALID,
      message: '颜色不正确',
    });
    expect(replaceBySongId).not.toHaveBeenCalled();
  });

  it('does not replace lines for another user’s song', async () => {
    findById.mockResolvedValue(songRow({ userId: otherUserId }));

    await expect(
      replaceLyricLines(userId, songId, replaceBody()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    });
  });

  it('logs unexpected replace failures', async () => {
    findById.mockResolvedValue(songRow());
    replaceBySongId.mockRejectedValue(new Error('db'));

    await expect(
      replaceLyricLines(userId, songId, replaceBody()),
    ).rejects.toThrow('db');
    expect(logger.error).toHaveBeenCalled();
  });

  it('updates and clears line timings', async () => {
    findById.mockResolvedValue(songRow());
    listBySongId.mockResolvedValue([lineRow({ startMs: null })]);

    await updateLyricLineTimings(
      userId,
      songId,
      timingsBody({ timings: [{ lineId, startMs: null }] }),
    );

    expect(updateTimings).toHaveBeenCalledWith(songId, [
      { lineId, startMs: null },
    ]);
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects timings for unknown or foreign line ids', async () => {
    findById.mockResolvedValue(songRow());
    listIdsBySongId.mockResolvedValue([{ id: lineId }]);

    await expect(
      updateLyricLineTimings(userId, songId, {
        timings: [
          {
            lineId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            startMs: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_LINE_INVALID,
      message: '歌词行不属于该歌曲',
    });
    expect(updateTimings).not.toHaveBeenCalled();
  });

  it('does not update timings for another user’s song', async () => {
    findById.mockResolvedValue(songRow({ userId: otherUserId }));

    await expect(
      updateLyricLineTimings(userId, songId, timingsBody()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_NOT_FOUND,
    });
  });

  it('logs unexpected timing update failures', async () => {
    findById.mockResolvedValue(songRow());
    updateTimings.mockRejectedValue(new Error('db'));

    await expect(
      updateLyricLineTimings(userId, songId, timingsBody()),
    ).rejects.toThrow('db');
    expect(logger.error).toHaveBeenCalled();
  });

  it('exports an empty document or owned songs without ids', async () => {
    await expect(exportLyricSongs(userId)).resolves.toEqual({
      version: 1,
      songs: [],
    });

    listOwnedByUserId.mockResolvedValue([
      songRow(),
      songRow({ id: 'song-2' }),
      songRow({ id: 'song-3', title: '空' }),
    ]);
    listBySongIds.mockResolvedValue([
      lineRow(),
      lineRow({ id: 'line-2', songId: 'song-2', position: 0 }),
    ]);

    const exported = await exportLyricSongs(userId);
    expect(exported.songs).toEqual([
      {
        title: '君の名は',
        meaning: '你的名字',
        artist: 'RADWIMPS',
        durationSeconds: 205,
        lines: [{ segments, meaning: '你的', startMs: 1000 }],
      },
      {
        title: '君の名は',
        meaning: '你的名字',
        artist: 'RADWIMPS',
        durationSeconds: 205,
        lines: [{ segments, meaning: '你的', startMs: 1000 }],
      },
      {
        title: '空',
        meaning: '你的名字',
        artist: 'RADWIMPS',
        durationSeconds: 205,
        lines: [],
      },
    ]);
    expect(listBySongIds).toHaveBeenCalledWith([songId, 'song-2', 'song-3']);
  });

  it('imports songs, skips existing titles, and isolates per-song failures', async () => {
    findByUserIdAndTitle.mockImplementation(async (_id, title) =>
      title === '既存' ? songRow({ title: '既存' }) : null,
    );
    createWithLines
      .mockResolvedValueOnce(songRow())
      .mockRejectedValueOnce(new Error('db'));

    const result = await importLyricSongsFromJsonFile(
      userId,
      jsonFile({
        version: 1,
        songs: [
          {
            title: '新規',
            meaning: '新歌',
            lines: [{ segments }],
          },
          {
            title: '既存',
            meaning: '已有',
            lines: [{ segments }],
          },
          {
            title: '壊れた',
            meaning: '坏的',
            lines: [
              { segments: [{ text: '君の', kana: 'きみの', color: 'red' }] },
            ],
          },
          {
            title: '失败',
            meaning: '失败',
            lines: [{ segments }],
          },
          { not: 'a song' },
        ],
      }),
    );

    expect(result).toEqual({
      created: 1,
      skipped: 1,
      failed: 3,
      errors: [
        { index: 2, title: '壊れた', message: '颜色不正确' },
        { index: 3, title: '失败', message: '导入失败' },
        { index: 4, title: '', message: '歌曲名不能为空' },
      ],
    });
    expect(createWithLines).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects an unreadable or shapeless import file', async () => {
    await expect(
      importLyricSongsFromJsonFile(
        userId,
        new File(['{'], 'broken.json', { type: 'application/json' }),
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_IMPORT_INVALID,
      message: '导入文件不是有效的 JSON',
    });

    await expect(
      importLyricSongsFromJsonFile(userId, jsonFile({ version: 2, songs: [] })),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LYRIC_SONG_IMPORT_INVALID,
      message: '导入文件版本不支持',
    });
  });
});
