import { describe, expect, it, mock } from 'bun:test';

mock.module('@api/infrastructure/external/ai/provider/moonshot-ai', () => ({
  moonshotProvider: 'kimi',
}));

const { moonshotPriceDimension } = await import(
  '@api/infrastructure/external/billing/moonshot-price'
);
const { collectPriceDimensions, llmPriceDimensionEnum } = await import(
  '@api/infrastructure/external/billing/llm-price-dimensions'
);

describe('collectPriceDimensions', () => {
  it('unions provider dimensions and drops duplicates', () => {
    const otherProviderDimension = {
      PROMPT: 'prompt',
      REASONING: 'reasoning',
    } as const;

    expect(
      collectPriceDimensions(moonshotPriceDimension, otherProviderDimension),
    ).toEqual({
      cached_read: 'cached_read',
      prompt: 'prompt',
      completion: 'completion',
      reasoning: 'reasoning',
    });
  });
});

describe('llmPriceDimensionEnum', () => {
  it('collects the current provider dimensions', () => {
    expect(llmPriceDimensionEnum).toEqual({
      cached_read: moonshotPriceDimension.CACHED_READ,
      prompt: moonshotPriceDimension.PROMPT,
      completion: moonshotPriceDimension.COMPLETION,
    });
  });
});
