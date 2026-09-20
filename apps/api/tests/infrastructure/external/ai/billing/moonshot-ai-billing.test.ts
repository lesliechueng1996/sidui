import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { recordUsageStatus } from '@api/domain/service/billing-service';
import { llmPriceUnit } from '@api/domain/service/price-service';
import type { LlmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';
import type { LlmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import type { LanguageModelUsage } from 'ai';

const logger = {
  error: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module('@api/infrastructure/external/ai/provider/moonshot-ai', () => ({
  moonshotProvider: 'kimi',
}));

const { MoonshotAiBilling } = await import(
  '@api/infrastructure/external/ai/billing/moonshot-ai-billing'
);
const { moonshotPriceDimension } = await import(
  '@api/infrastructure/external/billing/moonshot-price'
);

const usageWithDetails: LanguageModelUsage = {
  inputTokens: 120,
  outputTokens: 40,
  totalTokens: 160,
  inputTokenDetails: {
    noCacheTokens: 80,
    cacheReadTokens: 30,
    cacheWriteTokens: 10,
  },
  outputTokenDetails: {
    textTokens: 25,
    reasoningTokens: 15,
  },
};

describe('MoonshotAiBilling', () => {
  const create = mock(
    async (values: unknown) =>
      values as Awaited<ReturnType<LlmUsageEventRepository['create']>>,
  );
  const findByProviderAndModelId = mock(
    async (): ReturnType<
      LlmModelPriceRepository['findByProviderAndModelId']
    > => [
      {
        id: 'p-cache',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.CACHED_READ,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '1',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'p-prompt',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.PROMPT,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '4',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'p-out',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.COMPLETION,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '16',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ],
  );

  const billing = new MoonshotAiBilling(
    'kimi-k2.6',
    { create },
    {
      findByProviderAndModelId,
    },
  );

  beforeEach(() => {
    create.mockReset();
    findByProviderAndModelId.mockReset();
    logger.error.mockReset();
    create.mockImplementation(
      async (values: unknown) =>
        values as Awaited<ReturnType<LlmUsageEventRepository['create']>>,
    );
    findByProviderAndModelId.mockResolvedValue([
      {
        id: 'p-cache',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.CACHED_READ,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '1',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'p-prompt',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.PROMPT,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '4',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'p-out',
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: moonshotPriceDimension.COMPLETION,
        unit: llmPriceUnit.PER_MILLION_TOKENS,
        amount: '16',
        currency: 'CNY',
        source: 'manual',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
  });

  it('extracts token usage with optional details', () => {
    expect(billing.extractTokenUsage(usageWithDetails)).toEqual({
      inputTokens: 120,
      cacheReadTokens: 30,
      cacheWriteTokens: 10,
      outputTokens: 40,
      reasoningTokens: 15,
      webSearchCalls: 0,
    });

    expect(
      billing.extractTokenUsage({
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
      } as LanguageModelUsage),
    ).toEqual({
      inputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      webSearchCalls: 0,
    });
  });

  it('records a usage event from extracted tokens and the price snapshot', async () => {
    await billing.record({
      userId: 'user-1',
      feature: 'lyric-song-base-info',
      provider: billing.provider,
      modelId: 'kimi-k2.6',
      status: recordUsageStatus.SUCCESS,
      usage: usageWithDetails,
      durationMs: 33,
      providerResponseId: 'resp-1',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        feature: 'lyric-song-base-info',
        userId: 'user-1',
        status: recordUsageStatus.SUCCESS,
        inputTokens: 120,
        cacheReadTokens: 30,
        cacheWriteTokens: 10,
        outputTokens: 40,
        reasoningTokens: 15,
        webSearchCalls: 0,
        currency: 'CNY',
        durationMs: 33,
        providerResponseId: 'resp-1',
        usageRaw: usageWithDetails,
      }),
    );
  });
});
