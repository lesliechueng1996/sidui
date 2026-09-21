import { describe, expect, it, mock } from 'bun:test';

const createMoonshotAI = mock((options: unknown) => {
  return (modelId: string) => ({ modelId, options });
});

mock.module('@ai-sdk/moonshotai', () => ({
  createMoonshotAI,
}));

mock.module('@api/infrastructure/config/env', () => ({
  env: {
    MOONSHOT_API_KEY: 'test-key',
    MOONSHOT_BASE_URL: 'https://api.moonshot.cn/v1',
  },
}));

const { kimiModel, moonshotProvider, supportedModels } = await import(
  '@api/infrastructure/external/ai/provider/moonshot-ai'
);

describe('moonshot-ai provider', () => {
  it('uses the China endpoint and kimi-k2.6', () => {
    expect(moonshotProvider).toBe('kimi');
    expect(supportedModels).toEqual(['kimi-k2.6']);
    expect(createMoonshotAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://api.moonshot.cn/v1',
    });
    expect(kimiModel).toEqual(
      expect.objectContaining({
        modelId: 'kimi-k2.6',
      }),
    );
  });
});
