import { describe, expect, it, mock } from 'bun:test';

class FakeMoonshotAiBilling {
  readonly provider = 'kimi';

  constructor(
    readonly modelId: string,
    readonly usageRepository: unknown,
    readonly priceRepository: unknown,
  ) {}
}

mock.module('@api/infrastructure/external/ai/provider/moonshot-ai', () => ({
  supportedModels: ['kimi-k2.6'],
}));
mock.module(
  '@api/infrastructure/external/ai/billing/moonshot-ai-billing',
  () => ({
    MoonshotAiBilling: FakeMoonshotAiBilling,
  }),
);
mock.module(
  '@api/infrastructure/repository/llm-usage-event-repository',
  () => ({
    llmUsageEventRepository: { create: mock() },
  }),
);
mock.module(
  '@api/infrastructure/repository/llm-model-price-repository',
  () => ({
    llmModelPriceRepository: { findByProviderAndModelId: mock() },
  }),
);

const { aiBillingFactory } = await import(
  '@api/infrastructure/external/ai/billing/ai-billing-factory'
);

describe('aiBillingFactory', () => {
  it('returns Moonshot billing for a supported model', () => {
    const billing = aiBillingFactory('kimi-k2.6');

    expect(billing).toBeInstanceOf(FakeMoonshotAiBilling);
    expect(billing.provider).toBe('kimi');
  });

  it('throws for an unsupported model', () => {
    expect(() => aiBillingFactory('gpt-4.1')).toThrow(
      'Unsupported model: gpt-4.1',
    );
  });
});
