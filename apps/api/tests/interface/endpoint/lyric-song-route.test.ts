import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const songId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const lineId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const songDetail = {
  id: songId,
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
  lines: [
    {
      id: lineId,
      position: 0,
      segments: [{ text: '君の', kana: 'きみの', color: null }],
      meaning: '你的',
      startMs: 1000,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-02 00:00:00',
    },
  ],
};

const exportDocument = {
  version: 1 as const,
  songs: [
    {
      title: songDetail.title,
      meaning: songDetail.meaning,
      artist: songDetail.artist,
      lines: [
        {
          segments: songDetail.lines[0].segments,
          meaning: songDetail.lines[0].meaning,
          startMs: songDetail.lines[0].startMs,
        },
      ],
    },
  ],
};

const importResult = {
  created: 1,
  skipped: 0,
  failed: 0,
  errors: [],
};

const listLyricSongs = mock(async () => [
  {
    id: songId,
    title: songDetail.title,
    meaning: songDetail.meaning,
    artist: songDetail.artist,
    lineCount: 1,
    createdAt: songDetail.createdAt,
    updatedAt: songDetail.updatedAt,
  },
]);
const createLyricSong = mock(async () => ({ ...songDetail, lines: [] }));
const getLyricSong = mock(async () => songDetail);
const updateLyricSong = mock(async () => songDetail);
const deleteLyricSong = mock(async () => undefined);
const replaceLyricLines = mock(async () => songDetail);
const updateLyricLineTimings = mock(async () => songDetail);
const exportLyricSongs = mock(async () => exportDocument);
const importLyricSongsFromJsonFile = mock(async () => importResult);

mock.module('@api/application/service/lyric-song-service', () => ({
  listLyricSongs,
  createLyricSong,
  getLyricSong,
  updateLyricSong,
  deleteLyricSong,
  replaceLyricLines,
  updateLyricLineTimings,
  exportLyricSongs,
  importLyricSongsFromJsonFile,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({
      resolve: async () => ({
        user: { id: 'actor-1', role: 'user' },
        session: { id: 's1' },
      }),
    }),
  }),
}));

const { lyricSongRoute, lyricSongTag } = await import(
  '@api/interface/endpoint/lyric-song-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  lyricSongRoute.handle(
    new Request(`http://localhost/api/v1/lyric-songs${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('lyricSongRoute', () => {
  beforeEach(() => {
    listLyricSongs.mockReset();
    createLyricSong.mockReset();
    getLyricSong.mockReset();
    updateLyricSong.mockReset();
    deleteLyricSong.mockReset();
    replaceLyricLines.mockReset();
    updateLyricLineTimings.mockReset();
    exportLyricSongs.mockReset();
    importLyricSongsFromJsonFile.mockReset();

    listLyricSongs.mockResolvedValue([
      {
        id: songId,
        title: songDetail.title,
        meaning: songDetail.meaning,
        artist: songDetail.artist,
        lineCount: 1,
        createdAt: songDetail.createdAt,
        updatedAt: songDetail.updatedAt,
      },
    ]);
    createLyricSong.mockResolvedValue({ ...songDetail, lines: [] });
    getLyricSong.mockResolvedValue(songDetail);
    updateLyricSong.mockResolvedValue(songDetail);
    deleteLyricSong.mockResolvedValue(undefined);
    replaceLyricLines.mockResolvedValue(songDetail);
    updateLyricLineTimings.mockResolvedValue(songDetail);
    exportLyricSongs.mockResolvedValue(exportDocument);
    importLyricSongsFromJsonFile.mockResolvedValue(importResult);
  });

  it('exports an OpenAPI tag', () => {
    expect(lyricSongTag).toEqual({
      name: 'lyric-song',
      description: 'Lyric Song API',
    });
  });

  it('lists songs for the current user', async () => {
    const response = await jsonRequest('');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listLyricSongs).toHaveBeenCalledWith('actor-1');
    expect(body.data[0].id).toBe(songId);
  });

  it('creates a song', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        title: '君の名は',
        meaning: '你的名字',
        artist: 'RADWIMPS',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createLyricSong).toHaveBeenCalledWith('actor-1', {
      title: '君の名は',
      meaning: '你的名字',
      artist: 'RADWIMPS',
    });
    expect(body.data.id).toBe(songId);
  });

  it('exports songs as a JSON document', async () => {
    const response = await jsonRequest('/export');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(exportLyricSongs).toHaveBeenCalledWith('actor-1');
    expect(body.data.version).toBe(1);
    expect(body.data.songs).toHaveLength(1);
  });

  it('imports songs from a JSON file', async () => {
    const file = new File(['{"version":1,"songs":[]}'], 'lyric-songs.json', {
      type: 'application/json',
    });
    const form = new FormData();
    form.set('file', file);

    const response = await lyricSongRoute.handle(
      new Request('http://localhost/api/v1/lyric-songs/import', {
        method: 'POST',
        body: form,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(importLyricSongsFromJsonFile).toHaveBeenCalled();
    expect(body.data.created).toBe(1);
  });

  it('gets, updates, and deletes a song', async () => {
    const getResponse = await jsonRequest(`/${songId}`);
    expect(getResponse.status).toBe(200);
    expect(getLyricSong).toHaveBeenCalledWith('actor-1', songId);

    const patchResponse = await jsonRequest(`/${songId}`, {
      method: 'PATCH',
      body: JSON.stringify({ meaning: '你的名字' }),
    });
    expect(patchResponse.status).toBe(200);
    expect(updateLyricSong).toHaveBeenCalled();

    const deleteResponse = await jsonRequest(`/${songId}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(200);
    expect(deleteLyricSong).toHaveBeenCalledWith('actor-1', songId);
  });

  it('replaces lines and patches timings', async () => {
    const replaceResponse = await jsonRequest(`/${songId}/lines`, {
      method: 'PUT',
      body: JSON.stringify({
        lines: [
          {
            segments: [{ text: '君の', kana: 'きみの', color: null }],
            meaning: '你的',
            startMs: 1000,
          },
        ],
      }),
    });
    expect(replaceResponse.status).toBe(200);
    expect(replaceLyricLines).toHaveBeenCalled();

    const timingResponse = await jsonRequest(`/${songId}/line-timings`, {
      method: 'PATCH',
      body: JSON.stringify({
        timings: [{ lineId, startMs: null }],
      }),
    });
    expect(timingResponse.status).toBe(200);
    expect(updateLyricLineTimings).toHaveBeenCalledWith('actor-1', songId, {
      timings: [{ lineId, startMs: null }],
    });
  });
});
