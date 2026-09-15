import { describe, expect, it } from 'bun:test';
import { LyricSong } from '@api/domain/model/lyric/lyric-song';

describe('LyricSong', () => {
  it('trims the title and defaults the other fields', () => {
    const song = new LyricSong('  title  ');

    expect(song.title).toBe('title');
    expect(song.meaning).toBe('');
    expect(song.artist).toBe('');
    expect(song.durationSeconds).toBe(0);
  });
});
