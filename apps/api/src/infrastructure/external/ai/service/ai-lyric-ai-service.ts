import type { MoonshotAILanguageModelOptions } from '@ai-sdk/moonshotai';
import { LyricSong } from '@api/domain/model/lyric/lyric-song';
import type { LyricAiService } from '@api/domain/service/lyric-ai-service';
import { env } from '@api/infrastructure/config/env';
import { logger } from '@api/infrastructure/logger';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { lyricBaseInfoSystemPrompt } from '../prompt/lyric-base-info-prompt';
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

export class AiLyricAiService implements LyricAiService {
  constructor(private readonly model: typeof kimiModel = kimiModel) {}

  async getLyricSongBaseInfo(
    title: string,
    userId: string,
  ): Promise<LyricSong> {
    if (env.MOONSHOT_API_KEY.trim() === '') {
      logger.error('Moonshot API key is not configured');
      throw new Error('Moonshot API key is not configured');
    }

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
          userId,
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
}

export const aiLyricAiService = new AiLyricAiService();
