import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listGet,
  createPost,
  exportGet,
  importPost,
  detailGet,
  detailPatch,
  detailDelete,
  linesPut,
  timingsPatch,
} = vi.hoisted(() => ({
  listGet: vi.fn(),
  createPost: vi.fn(),
  exportGet: vi.fn(),
  importPost: vi.fn(),
  detailGet: vi.fn(),
  detailPatch: vi.fn(),
  detailDelete: vi.fn(),
  linesPut: vi.fn(),
  timingsPatch: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'lyric-songs': Object.assign(
          (params: { id: string }) => ({
            get: () => detailGet(params),
            patch: (body: unknown) => detailPatch(params, body),
            delete: () => detailDelete(params),
            lines: {
              put: (body: unknown) => linesPut(params, body),
            },
            'line-timings': {
              patch: (body: unknown) => timingsPatch(params, body),
            },
          }),
          {
            get: listGet,
            post: createPost,
            export: { get: exportGet },
            import: { post: importPost },
          },
        ),
      },
    },
  },
}));

describe('lyric-songs-api', () => {
  beforeEach(() => {
    listGet.mockReset();
    createPost.mockReset();
    exportGet.mockReset();
    importPost.mockReset();
    detailGet.mockReset();
    detailPatch.mockReset();
    detailDelete.mockReset();
    linesPut.mockReset();
    timingsPatch.mockReset();
  });

  it('unwraps list, create, detail, and export envelopes', async () => {
    listGet.mockResolvedValue({ data: { data: [{ id: '1' }] }, error: null });
    createPost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    detailGet.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    exportGet.mockResolvedValue({
      data: { data: { version: 1, songs: [] } },
      error: null,
    });

    const api = await import('@/lib/api/lyric-songs-api');
    await expect(api.listLyricSongs()).resolves.toEqual([{ id: '1' }]);
    await expect(
      api.createLyricSong({ title: '歌', meaning: '中文', artist: null }),
    ).resolves.toEqual({ id: 'n' });
    await expect(api.getLyricSong('1')).resolves.toEqual({ id: '1' });
    await expect(api.exportLyricSongs()).resolves.toEqual({
      version: 1,
      songs: [],
    });
  });

  it('updates, deletes, replaces lines, patches timings, and imports', async () => {
    detailPatch.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    detailDelete.mockResolvedValue({ error: null });
    linesPut.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    timingsPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    importPost.mockResolvedValue({
      data: { data: { created: 1, skipped: 0, failed: 0 } },
      error: null,
    });

    const api = await import('@/lib/api/lyric-songs-api');
    await expect(
      api.updateLyricSong('1', { meaning: '中文' }),
    ).resolves.toEqual({ id: '1' });
    await api.deleteLyricSong('1');
    await expect(api.replaceLyricLines('1', [])).resolves.toEqual({ id: '1' });
    await expect(
      api.updateLyricLineTimings('1', [{ lineId: 'l1', startMs: null }]),
    ).resolves.toEqual({ id: '1' });
    await expect(
      api.importLyricSongsFromJsonFile(new File(['{}'], 'a.json')),
    ).resolves.toEqual({ created: 1, skipped: 0, failed: 0 });
  });

  it('throws fallbacks when the API omits a message', async () => {
    const failure = { data: null, error: { value: {} } };
    listGet.mockResolvedValue(failure);
    createPost.mockResolvedValue(failure);
    detailGet.mockResolvedValue(failure);
    detailPatch.mockResolvedValue(failure);
    detailDelete.mockResolvedValue(failure);
    linesPut.mockResolvedValue(failure);
    timingsPatch.mockResolvedValue(failure);
    exportGet.mockResolvedValue(failure);
    importPost.mockResolvedValue(failure);

    const api = await import('@/lib/api/lyric-songs-api');
    await expect(api.listLyricSongs()).rejects.toThrow('获取歌曲列表失败');
    await expect(
      api.createLyricSong({ title: 'a', meaning: 'b' }),
    ).rejects.toThrow('创建歌曲失败');
    await expect(api.getLyricSong('1')).rejects.toThrow('获取歌曲失败');
    await expect(api.updateLyricSong('1', { title: 'a' })).rejects.toThrow(
      '更新歌曲失败',
    );
    await expect(api.deleteLyricSong('1')).rejects.toThrow('删除歌曲失败');
    await expect(api.replaceLyricLines('1', [])).rejects.toThrow(
      '保存歌词失败',
    );
    await expect(api.updateLyricLineTimings('1', [])).rejects.toThrow(
      '更新时间戳失败',
    );
    await expect(api.exportLyricSongs()).rejects.toThrow('导出歌曲失败');
    await expect(
      api.importLyricSongsFromJsonFile(new File([''], 'a.json')),
    ).rejects.toThrow('导入歌曲失败');
  });
});
