import type { TokenUsage } from '@api/domain/service/billing-service';
import type {
  LlmPriceSnapshot,
  LlmPriceUnit,
  PriceService,
} from '@api/domain/service/price-service';
import type { LlmCurrentPriceReader } from '@api/infrastructure/repository/llm-model-price-repository';
import type { BigNumber } from 'bignumber.js';

export abstract class BasePrice implements PriceService {
  constructor(
    protected readonly provider: string,
    protected readonly modelId: string,
    private readonly llmModelPriceRepository: LlmCurrentPriceReader,
  ) {}

  abstract calculate(
    tokenUsage: TokenUsage,
    priceSnapshot: LlmPriceSnapshot,
  ): BigNumber;

  async loadPriceSnapshot(): Promise<LlmPriceSnapshot> {
    const prices = await this.llmModelPriceRepository.findByProviderAndModelId(
      this.provider,
      this.modelId,
    );

    if (prices.length === 0) {
      throw new Error(`No current price for ${this.provider}/${this.modelId}`);
    }

    return {
      currency: prices[0].currency,
      prices: prices.map((price) => ({
        id: price.id,
        dimension: price.dimension,
        unit: price.unit as LlmPriceUnit,
        amount: price.amount,
      })),
    };
  }
}
