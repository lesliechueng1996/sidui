import { apiClient } from '@/lib/api-client';

export const lyricSongsQueryKey = ['lyric-songs'] as const;
export const lyricSongDetailQueryKey = (id: string) =>
  ['lyric-songs', id] as const;

export const listLyricSongs = async () => {
  const { data, error } = await apiClient.api.v1['lyric-songs'].get();

  if (error) {
    throw new Error(error.value.message ?? '获取歌曲列表失败');
  }

  return data.data;
};

export type LyricSongListItem = Awaited<
  ReturnType<typeof listLyricSongs>
>[number];

export type CreateLyricSongValues = {
  title: string;
  meaning: string;
  artist?: string | null;
  durationSeconds: number;
};

export const createLyricSong = async (body: CreateLyricSongValues) => {
  const { data, error } = await apiClient.api.v1['lyric-songs'].post({
    title: body.title,
    meaning: body.meaning,
    artist: body.artist ?? undefined,
    durationSeconds: body.durationSeconds,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建歌曲失败');
  }

  return data.data;
};

export const getLyricSong = async (songId: string) => {
  const { data, error } = await apiClient.api.v1['lyric-songs']({
    id: songId,
  }).get();

  if (error) {
    throw new Error(error.value.message ?? '获取歌曲失败');
  }

  return data.data;
};

export type LyricSongDetail = Awaited<ReturnType<typeof getLyricSong>>;

export const updateLyricSong = async (
  songId: string,
  body: Partial<CreateLyricSongValues>,
) => {
  const { data, error } = await apiClient.api.v1['lyric-songs']({
    id: songId,
  }).patch(body);

  if (error) {
    throw new Error(error.value.message ?? '更新歌曲失败');
  }

  return data.data;
};

export const deleteLyricSong = async (songId: string) => {
  const { error } = await apiClient.api.v1['lyric-songs']({
    id: songId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除歌曲失败');
  }
};

export type ReplaceLyricLine = {
  segments: Array<{
    text: string;
    kana: string;
    color:
      | 'rose'
      | 'amber'
      | 'lime'
      | 'sky'
      | 'violet'
      | 'pink'
      | 'orange'
      | 'teal'
      | null;
  }>;
  meaning?: string | null;
  startMs?: number | null;
};

export const replaceLyricLines = async (
  songId: string,
  lines: ReplaceLyricLine[],
) => {
  const { data, error } = await apiClient.api.v1['lyric-songs']({
    id: songId,
  }).lines.put({ lines });

  if (error) {
    throw new Error(error.value.message ?? '保存歌词失败');
  }

  return data.data;
};

export type LyricLineTiming = {
  lineId: string;
  startMs: number | null;
};

export const updateLyricLineTimings = async (
  songId: string,
  timings: LyricLineTiming[],
) => {
  const { data, error } = await apiClient.api.v1['lyric-songs']({
    id: songId,
  })['line-timings'].patch({ timings });

  if (error) {
    throw new Error(error.value.message ?? '更新时间戳失败');
  }

  return data.data;
};

export const exportLyricSongs = async () => {
  const { data, error } = await apiClient.api.v1['lyric-songs'].export.get();

  if (error) {
    throw new Error(error.value.message ?? '导出歌曲失败');
  }

  return data.data;
};

export const importLyricSongsFromJsonFile = async (file: File) => {
  const { data, error } = await apiClient.api.v1['lyric-songs'].import.post({
    file,
  });

  if (error) {
    throw new Error(error.value.message ?? '导入歌曲失败');
  }

  return data.data;
};

export const getLyricSongBaseInfoFromAi = async (title: string) => {
  const { data, error } = await apiClient.api.v1['lyric-songs'].ai[
    'base-info'
  ].post({ title });

  if (error) {
    throw new Error(error.value.message ?? '获取歌曲资料失败');
  }

  return data.data;
};

export type LyricSongAiBaseInfo = Awaited<
  ReturnType<typeof getLyricSongBaseInfoFromAi>
>;
