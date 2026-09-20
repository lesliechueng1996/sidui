import type { LlmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';
import type { LlmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import { MoonshotPrice } from '../../billing/moonshot-price';
import { moonshotProvider } from '../provider/moonshot-ai';
import { AiBilling } from './ai-billing';

export class MoonshotAiBilling extends AiBilling {
  constructor(
    modelId: string,
    llmUsageEventRepository: LlmUsageEventRepository,
    llmModelPriceRepository: LlmModelPriceRepository,
  ) {
    super(
      llmUsageEventRepository,
      new MoonshotPrice(modelId, llmModelPriceRepository),
      moonshotProvider,
    );
  }
}
