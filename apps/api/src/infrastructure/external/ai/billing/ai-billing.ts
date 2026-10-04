import type { TokenUsage } from '@api/domain/service/billing-service';
import type { LanguageModelUsage } from 'ai';
import { BaseBilling } from '../../billing/base-billing';

export abstract class AiBilling extends BaseBilling<LanguageModelUsage> {
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
