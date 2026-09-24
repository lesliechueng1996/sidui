import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { LyricSong } from '@api/domain/model/lyric/lyric-song';
import {
  BadRequestException,
  ERROR_CODES,
  InternalServerErrorException,
} from '@api/shared/exception';

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const constructedUserIds: string[] = [];

const getLyricSongBaseInfo = mock(async (_title: string) => new LyricSong('t'));
const getLyricSongLyrics = mock(async (_title: string, _artist?: string) => '');

class AiLyricAiService {
  constructor(userId: string) {
    constructedUserIds.push(userId);
  }

  getLyricSongBaseInfo = getLyricSongBaseInfo;
  getLyricSongLyrics = getLyricSongLyrics;
}

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module(
  '@api/infrastructure/external/ai/service/ai-lyric-ai-service',
  () => ({
    AiLyricAiService,
  }),
);

const { getLyricSongBaseInfoFromAi, getLyricSongLyricsFromAi } = await import(
  '@api/application/service/lyric-ai-service'
);

const makeSong = (overrides: Partial<LyricSong> = {}): LyricSong => {
  const song = new LyricSong(overrides.title ?? '愛される花 愛されぬ花');
  song.meaning = overrides.meaning ?? '被爱的花和不被爱的花';
  song.artist = overrides.artist ?? '三田寛子';
  song.durationSeconds = overrides.durationSeconds ?? 248;
  return song;
};

describe('getLyricSongBaseInfoFromAi', () => {
  const userId = 'user-1';

  beforeEach(() => {
    constructedUserIds.length = 0;
    getLyricSongBaseInfo.mockReset();
    getLyricSongLyrics.mockReset();
    logger.error.mockReset();
    getLyricSongBaseInfo.mockResolvedValue(makeSong());
    getLyricSongLyrics.mockResolvedValue('君の名前を呼ぶ');
  });

  it('returns mapped base info for a known song', async () => {
    const result = await getLyricSongBaseInfoFromAi(
      '  愛される花 愛されぬ花  ',
      userId,
    );

    expect(constructedUserIds).toEqual([userId]);
    expect(getLyricSongBaseInfo).toHaveBeenCalledWith('愛される花 愛されぬ花');
    expect(result).toEqual({
      title: '愛される花 愛されぬ花',
      meaning: '被爱的花和不被爱的花',
      artist: '三田寛子',
      durationSeconds: 248,
    });
  });

  it('maps blank fields and invalid durations to null', async () => {
    getLyricSongBaseInfo.mockResolvedValueOnce(
      makeSong({ meaning: '  ', artist: '', durationSeconds: 0 }),
    );
    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).resolves.toMatchObject({
      meaning: null,
      artist: null,
      durationSeconds: null,
    });

    getLyricSongBaseInfo.mockResolvedValueOnce(
      makeSong({ durationSeconds: 9 }),
    );
    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).resolves.toMatchObject({
      durationSeconds: null,
    });

    getLyricSongBaseInfo.mockResolvedValueOnce(
      makeSong({ durationSeconds: 10.5 }),
    );
    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).resolves.toMatchObject({
      durationSeconds: null,
    });

    getLyricSongBaseInfo.mockResolvedValueOnce(
      makeSong({ durationSeconds: 10 }),
    );
    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).resolves.toMatchObject({
      durationSeconds: 10,
    });
  });

  it('rejects a blank title', async () => {
    await expect(
      getLyricSongBaseInfoFromAi('   ', userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      getLyricSongBaseInfoFromAi('   ', userId),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: ERROR_CODES.BAD_REQUEST,
      message: '歌曲名不能为空',
    });
    expect(getLyricSongBaseInfo).not.toHaveBeenCalled();
  });

  it('wraps adapter failures', async () => {
    getLyricSongBaseInfo.mockRejectedValue(new Error('network down'));

    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      getLyricSongBaseInfoFromAi('title', userId),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: ERROR_CODES.LYRIC_AI_UNAVAILABLE,
      message: '获取歌曲资料失败',
    });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('getLyricSongLyricsFromAi', () => {
  const userId = 'user-1';

  beforeEach(() => {
    constructedUserIds.length = 0;
    getLyricSongLyrics.mockReset();
    logger.error.mockReset();
    getLyricSongLyrics.mockResolvedValue('君の名前を呼ぶ');
  });

  it('returns lyrics for a known song', async () => {
    const result = await getLyricSongLyricsFromAi(
      '  愛される花 愛されぬ花  ',
      userId,
    );

    expect(constructedUserIds).toEqual([userId]);
    expect(getLyricSongLyrics).toHaveBeenCalledWith(
      '愛される花 愛されぬ花',
      undefined,
    );
    expect(result).toEqual({
      title: '愛される花 愛されぬ花',
      lyrics: '君の名前を呼ぶ',
    });
  });

  it('passes a trimmed artist and drops a blank one', async () => {
    await getLyricSongLyricsFromAi('  title  ', userId, '  三田寛子  ');
    expect(getLyricSongLyrics).toHaveBeenCalledWith('title', '三田寛子');

    getLyricSongLyrics.mockClear();
    await getLyricSongLyricsFromAi('title', userId, '   ');
    expect(getLyricSongLyrics).toHaveBeenCalledWith('title', undefined);
  });

  it('maps blank lyrics to null', async () => {
    getLyricSongLyrics.mockResolvedValueOnce('  ');

    await expect(
      getLyricSongLyricsFromAi('title', userId),
    ).resolves.toMatchObject({
      lyrics: null,
    });
  });

  it('rejects a blank title', async () => {
    await expect(
      getLyricSongLyricsFromAi('   ', userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(getLyricSongLyrics).not.toHaveBeenCalled();
  });

  it('wraps adapter failures', async () => {
    getLyricSongLyrics.mockRejectedValue(new Error('network down'));

    await expect(
      getLyricSongLyricsFromAi('title', userId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      getLyricSongLyricsFromAi('title', userId),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: ERROR_CODES.LYRIC_AI_UNAVAILABLE,
      message: '获取歌词失败',
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
