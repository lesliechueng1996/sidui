import { beforeEach, describe, expect, it, mock } from 'bun:test';

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const env = {
  MOONSHOT_API_KEY: 'test-key',
};

const generateText = mock(async () => ({
  output: {
    meaning: '被爱的花和不被爱的花',
    artist: '三田寛子',
    durationSeconds: 248,
  },
}));

const outputObject = mock((options: unknown) => options);

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module('@api/infrastructure/config/env', () => ({ env }));
mock.module('@api/infrastructure/external/ai/provider/moonshot-ai', () => ({
  kimiModel: 'kimi-k2.6',
}));
mock.module('ai', () => ({
  generateText,
  Output: {
    object: outputObject,
  },
}));

const { lyricBaseInfoSystemPrompt } = await import(
  '@api/infrastructure/external/ai/prompt/lyric-base-info-prompt'
);
const { AiLyricAiService, aiLyricAiService } = await import(
  '@api/infrastructure/external/ai/service/ai-lyric-ai-service'
);

describe('AiLyricAiService', () => {
  const service = new AiLyricAiService();

  beforeEach(() => {
    env.MOONSHOT_API_KEY = 'test-key';
    generateText.mockReset();
    outputObject.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    outputObject.mockImplementation((options: unknown) => options);
    generateText.mockResolvedValue({
      output: {
        meaning: '被爱的花和不被爱的花',
        artist: '三田寛子',
        durationSeconds: 248,
      },
    });
  });

  it('exports a singleton', () => {
    expect(aiLyricAiService).toBeInstanceOf(AiLyricAiService);
  });

  it('throws when the Moonshot API key is missing', async () => {
    env.MOONSHOT_API_KEY = '  ';

    await expect(
      service.getLyricSongBaseInfo('title', 'user-1'),
    ).rejects.toThrow('Moonshot API key is not configured');
    expect(generateText).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('fills a lyric song from structured model output', async () => {
    const result = await service.getLyricSongBaseInfo(
      '愛される花 愛されぬ花',
      'user-1',
    );

    expect(result.title).toBe('愛される花 愛されぬ花');
    expect(result.meaning).toBe('被爱的花和不被爱的花');
    expect(result.artist).toBe('三田寛子');
    expect(result.durationSeconds).toBe(248);
    expect(outputObject).toHaveBeenCalled();
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'kimi-k2.6',
        prompt: '愛される花 愛されぬ花',
        system: lyricBaseInfoSystemPrompt,
        timeout: 20_000,
        providerOptions: {
          moonshotai: {
            thinking: {
              type: 'disabled',
            },
          },
        },
        runtimeContext: {
          userId: 'user-1',
          feature: 'lyric-song-base-info',
        },
      }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('logs and rethrows generateText failures', async () => {
    generateText.mockRejectedValueOnce(new Error('timeout'));

    await expect(
      service.getLyricSongBaseInfo('title', 'user-1'),
    ).rejects.toThrow('timeout');
    expect(logger.error).toHaveBeenCalled();
  });
});
