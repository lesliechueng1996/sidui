import { AiLyricAiService } from '@api/infrastructure/external/ai/service/ai-lyric-ai-service';
import { logger } from '@api/infrastructure/logger';
import type { LyricSongAiBaseInfoResponse } from '@api/interface/schema/lyric-song-schema';
import {
  BadRequestException,
  ERROR_CODES,
  InternalServerErrorException,
} from '@api/shared/exception';
import { MIN_LYRIC_DURATION_SECONDS } from '@api/shared/util/lyric';

const toOptionalText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toOptionalDurationSeconds = (value: number): number | null => {
  if (!Number.isInteger(value) || value < MIN_LYRIC_DURATION_SECONDS) {
    return null;
  }
  return value;
};

export const getLyricSongBaseInfoFromAi = async (
  title: string,
  userId: string,
): Promise<LyricSongAiBaseInfoResponse> => {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    throw new BadRequestException('歌曲名不能为空');
  }

  try {
    const aiLyricAiService = new AiLyricAiService(userId);
    const lyricSong = await aiLyricAiService.getLyricSongBaseInfo(trimmedTitle);
    return {
      title: lyricSong.title,
      meaning: toOptionalText(lyricSong.meaning),
      artist: toOptionalText(lyricSong.artist),
      durationSeconds: toOptionalDurationSeconds(lyricSong.durationSeconds),
    };
  } catch (error) {
    logger.error('Lookup lyric song base info failed, {title}, {error}', {
      title: trimmedTitle,
      error,
    });
    throw new InternalServerErrorException(
      '获取歌曲资料失败',
      ERROR_CODES.LYRIC_AI_UNAVAILABLE,
    );
  }
};
