import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { TokenUsage } from '@api/domain/service/billing-service';
import { llmPriceUnit } from '@api/domain/service/price-service';
import type { LlmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';

const logger = {
  error: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module('@api/infrastructure/external/ai/provider/moonshot-ai', () => ({
  moonshotProvider: 'kimi',
}));

const { MoonshotPrice, moonshotPriceDimension } = await import(
  '@api/infrastructure/external/billing/moonshot-price'
);

const tokenUsage = (overrides: Partial<TokenUsage> = {}): TokenUsage => ({
  inputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  webSearchCalls: 0,
  ...overrides,
});

const perMillion = (dimension: string, amount: string, id: string) => ({
  id,
  dimension,
  unit: llmPriceUnit.PER_MILLION_TOKENS,
  amount,
});

describe('MoonshotPrice', () => {
  const findByProviderAndModelId = mock(
    async (): ReturnType<
      LlmModelPriceRepository['findByProviderAndModelId']
    > => [],
  );
  const price = new MoonshotPrice('kimi-k2.6', {
    findByProviderAndModelId,
  });

  beforeEach(() => {
    findByProviderAndModelId.mockReset();
    logger.error.mockReset();
  });

  it('charges cached read, uncached prompt, and completion', () => {
    const cost = price.calculate(
      tokenUsage({
        inputTokens: 1_500_000,
        cacheReadTokens: 500_000,
        outputTokens: 250_000,
      }),
      {
        currency: 'CNY',
        prices: [
          perMillion(moonshotPriceDimension.CACHED_READ, '1', 'p-cache'),
          perMillion(moonshotPriceDimension.PROMPT, '4', 'p-prompt'),
          perMillion(moonshotPriceDimension.COMPLETION, '16', 'p-out'),
        ],
      },
    );

    expect(cost.toString()).toBe('8.5');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('clamps uncached prompt tokens at zero when cache read exceeds input', () => {
    const cost = price.calculate(
      tokenUsage({
        inputTokens: 100,
        cacheReadTokens: 180,
        outputTokens: 0,
      }),
      {
        currency: 'CNY',
        prices: [
          perMillion(moonshotPriceDimension.CACHED_READ, '1', 'p-cache'),
          perMillion(moonshotPriceDimension.PROMPT, '4', 'p-prompt'),
          perMillion(moonshotPriceDimension.COMPLETION, '16', 'p-out'),
        ],
      },
    );

    expect(cost.toString()).toBe('0.00018');
  });

  it('returns zero when every token count is zero', () => {
    const cost = price.calculate(tokenUsage(), {
      currency: 'CNY',
      prices: [
        perMillion(moonshotPriceDimension.CACHED_READ, '1', 'p-cache'),
        perMillion(moonshotPriceDimension.PROMPT, '4', 'p-prompt'),
        perMillion(moonshotPriceDimension.COMPLETION, '16', 'p-out'),
      ],
    });

    expect(cost.toString()).toBe('0');
  });

  it('logs missing dimensions and bills the rest as zero for those parts', () => {
    const cost = price.calculate(
      tokenUsage({
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }),
      {
        currency: 'CNY',
        prices: [perMillion(moonshotPriceDimension.PROMPT, '4', 'p-prompt')],
      },
    );

    expect(cost.toString()).toBe('4');
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      'Missing price dimension {dimension} for {provider}/{modelId}',
      {
        dimension: moonshotPriceDimension.CACHED_READ,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
      },
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Missing price dimension {dimension} for {provider}/{modelId}',
      {
        dimension: moonshotPriceDimension.COMPLETION,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
      },
    );
  });

  it('loads a price snapshot from current rows', async () => {
    findByProviderAndModelId.mockResolvedValueOnce([
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
    ]);

    await expect(price.loadPriceSnapshot()).resolves.toEqual({
      currency: 'CNY',
      prices: [perMillion(moonshotPriceDimension.PROMPT, '4', 'p-prompt')],
    });
    expect(findByProviderAndModelId).toHaveBeenCalledWith('kimi', 'kimi-k2.6');
  });

  it('throws when no current price rows exist', async () => {
    findByProviderAndModelId.mockResolvedValueOnce([]);

    await expect(price.loadPriceSnapshot()).rejects.toThrow(
      'No current price for kimi/kimi-k2.6',
    );
  });
});
