import type { LyricSong } from '../model/lyric/lyric-song';

export interface LyricAiService {
  getLyricSongBaseInfo: (title: string) => Promise<LyricSong>;
}
