import type { TokenUsage } from '@api/domain/service/billing-service';
import type { PriceService } from '@api/domain/service/price-service';
import type { LlmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import type { LanguageModelUsage } from 'ai';
import { BaseBilling } from '../../billing/base-billing';

export abstract class AiBilling extends BaseBilling<LanguageModelUsage> {
  constructor(
    llmUsageEventRepository: LlmUsageEventRepository,
    priceService: PriceService,
    provider: string,
  ) {
    super(llmUsageEventRepository, priceService, provider);
  }

  extractTokenUsage(usage: LanguageModelUsage): TokenUsage {
    return {
      inputTokens: usage.inputTokens ?? 0,
      cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
      cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? 0,
      webSearchCalls: this.extractWebSearchCalls(usage),
    };
  }

  extractWebSearchCalls(_usage: LanguageModelUsage): number {
    return 0;
  }
}
