import type { TokenUsage } from '@api/domain/service/billing-service';
import {
  type LlmPriceSnapshot,
  llmPriceUnit,
} from '@api/domain/service/price-service';
import { logger } from '@api/infrastructure/logger';
import type { LlmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';
import { BigNumber } from 'bignumber.js';
import { moonshotProvider } from '../ai/provider/moonshot-ai';
import { BasePrice } from './base-price';

export const moonshotPriceDimension = {
  CACHED_READ: 'cached_read',
  PROMPT: 'prompt',
  COMPLETION: 'completion',
} as const;

export class MoonshotPrice extends BasePrice {
  constructor(
    modelId: string,
    llmModelPriceRepository: LlmModelPriceRepository,
  ) {
    super(moonshotProvider, modelId, llmModelPriceRepository);
  }

  calculate(
    tokenUsage: TokenUsage,
    priceSnapshot: LlmPriceSnapshot,
  ): BigNumber {
    const cachedReadCost = this.costForMillionTokens(
      priceSnapshot,
      moonshotPriceDimension.CACHED_READ,
      tokenUsage.cacheReadTokens,
    );
    const uncachedPromptCost = this.costForMillionTokens(
      priceSnapshot,
      moonshotPriceDimension.PROMPT,
      Math.max(0, tokenUsage.inputTokens - tokenUsage.cacheReadTokens),
    );
    const completionCost = this.costForMillionTokens(
      priceSnapshot,
      moonshotPriceDimension.COMPLETION,
      tokenUsage.outputTokens,
    );

    return cachedReadCost.plus(uncachedPromptCost).plus(completionCost);
  }

  private costForMillionTokens(
    priceSnapshot: LlmPriceSnapshot,
    dimension: string,
    tokens: number,
  ): BigNumber {
    const price = priceSnapshot.prices.find(
      (item) =>
        item.dimension === dimension &&
        item.unit === llmPriceUnit.PER_MILLION_TOKENS,
    );

    if (!price) {
      logger.error(
        'Missing price dimension {dimension} for {provider}/{modelId}',
        {
          dimension,
          provider: this.provider,
          modelId: this.modelId,
        },
      );
      return new BigNumber(0);
    }

    if (tokens === 0) {
      return new BigNumber(0);
    }

    return new BigNumber(tokens).div(1_000_000).multipliedBy(price.amount);
  }
}
