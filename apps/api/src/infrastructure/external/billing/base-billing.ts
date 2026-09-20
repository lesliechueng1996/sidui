import type {
  BillingService,
  RecordUsageInput,
  TokenUsage,
} from '@api/domain/service/billing-service';
import type {
  LlmPriceSnapshot,
  PriceService,
} from '@api/domain/service/price-service';
import type { LlmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import type { BigNumber } from 'bignumber.js';

export abstract class BaseBilling<UsageRaw>
  implements BillingService<UsageRaw>
{
  constructor(
    private readonly llmUsageEventRepository: LlmUsageEventRepository,
    private readonly priceService: PriceService,
    public readonly provider: string,
  ) {}

  async record(input: RecordUsageInput<UsageRaw>): Promise<void> {
    const tokenUsage = this.extractTokenUsage(input.usage);
    const priceSnapshot = await this.priceService.loadPriceSnapshot();
    const estimatedCost = this.priceService.calculate(
      tokenUsage,
      priceSnapshot,
    );
    await this.saveLlmUsageEvent(
      input,
      tokenUsage,
      estimatedCost,
      priceSnapshot,
    );
  }

  abstract extractTokenUsage(usageRaw: UsageRaw): TokenUsage;

  async saveLlmUsageEvent(
    input: RecordUsageInput<UsageRaw>,
    tokenUsage: TokenUsage,
    estimatedCost: BigNumber,
    priceSnapshot: LlmPriceSnapshot,
  ) {
    await this.llmUsageEventRepository.create({
      provider: input.provider,
      modelId: input.modelId,
      feature: input.feature,
      userId: input.userId,
      status: input.status,
      inputTokens: tokenUsage.inputTokens,
      cacheReadTokens: tokenUsage.cacheReadTokens,
      cacheWriteTokens: tokenUsage.cacheWriteTokens,
      outputTokens: tokenUsage.outputTokens,
      reasoningTokens: tokenUsage.reasoningTokens,
      webSearchCalls: tokenUsage.webSearchCalls,
      estimatedCost: estimatedCost.toString(),
      currency: priceSnapshot.currency,
      priceSnapshot: priceSnapshot,
      usageRaw: input.usage,
      durationMs: input.durationMs,
      providerResponseId: input.providerResponseId,
    });
  }
}
