import type { MoonshotAILanguageModelOptions } from '@ai-sdk/moonshotai';
import { LyricSong } from '@api/domain/model/lyric/lyric-song';
import type { LyricAiService } from '@api/domain/service/lyric-ai-service';
import { env } from '@api/infrastructure/config/env';
import { logger } from '@api/infrastructure/logger';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import {
  lyricBaseInfoSystemPrompt,
  lyricSongLyricsSystemPrompt,
} from '../prompt/lyric-base-info-prompt';
import { kimiModel } from '../provider/moonshot-ai';
import { type AiRuntimeContext, aiTelemetryOptions } from '../runtime-context';

const BASE_INFO_TIMEOUT_MS = 20_000;

const lyricSongBaseInfoSchema = z.object({
  meaning: z.string().describe('歌曲的中文歌名。不知道则填空字符串。'),
  artist: z.string().describe('演唱者的日语原名。不知道则填空字符串。'),
  durationSeconds: z
    .number()
    .int()
    .nonnegative()
    .describe('歌曲时长（秒），整数。不知道则填 0。'),
});

const lyricSongLyricsSchema = z.object({
  lyrics: z.string().describe('歌曲的歌词。不知道则填空字符串。'),
});

export class AiLyricAiService implements LyricAiService {
  constructor(
    private readonly userId: string,
    private readonly model: typeof kimiModel = kimiModel,
  ) {}

  #checkApiKey() {
    if (env.MOONSHOT_API_KEY.trim() === '') {
      logger.error('Moonshot API key is not configured');
      throw new Error('Moonshot API key is not configured');
    }
  }

  async getLyricSongBaseInfo(title: string): Promise<LyricSong> {
    this.#checkApiKey();

    const lyricSong = new LyricSong(title);

    try {
      const { output } = await generateText({
        model: this.model,
        output: Output.object({
          schema: lyricSongBaseInfoSchema,
        }),
        system: lyricBaseInfoSystemPrompt,
        prompt: title,
        timeout: BASE_INFO_TIMEOUT_MS,
        providerOptions: {
          moonshotai: {
            thinking: {
              type: 'disabled',
            },
          } satisfies MoonshotAILanguageModelOptions,
        },
        runtimeContext: {
          userId: this.userId,
          feature: 'lyric-song-base-info',
        } satisfies AiRuntimeContext,
        telemetry: aiTelemetryOptions,
      });

      lyricSong.meaning = output.meaning;
      lyricSong.artist = output.artist;
      lyricSong.durationSeconds = output.durationSeconds;
    } catch (error) {
      logger.error('Lyric song base info lookup failed, {title}, {error}', {
        title,
        error,
      });
      throw error;
    }

    logger.info('Looked up lyric song base info for {title}', { title });
    return lyricSong;
  }

  async getLyricSongLyrics(title: string, artist?: string) {
    this.#checkApiKey();

    const prompt = artist
      ? `标题：${title}\n歌手：${artist}`
      : `标题：${title}`;

    try {
      const { output } = await generateText({
        model: this.model,
        output: Output.object({
          schema: lyricSongLyricsSchema,
        }),
        system: lyricSongLyricsSystemPrompt,
        prompt,
        timeout: BASE_INFO_TIMEOUT_MS,
        providerOptions: {
          moonshotai: {
            thinking: {
              type: 'disabled',
            },
          } satisfies MoonshotAILanguageModelOptions,
        },
        runtimeContext: {
          userId: this.userId,
          feature: 'lyric-song-lyrics',
        } satisfies AiRuntimeContext,
        telemetry: aiTelemetryOptions,
      });

      return output.lyrics;
    } catch (error) {
      logger.error('Lyric song lyrics lookup failed, {title}, {error}', {
        title,
        error,
      });
      throw error;
    }
  }
}
