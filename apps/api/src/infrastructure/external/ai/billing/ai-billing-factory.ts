import { llmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';
import { llmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import { supportedModels as moonshotSupportedModels } from '../provider/moonshot-ai';
import { MoonshotAiBilling } from './moonshot-ai-billing';

export const aiBillingFactory = (modelId: string) => {
  if (moonshotSupportedModels.includes(modelId)) {
    return new MoonshotAiBilling(
      modelId,
      llmUsageEventRepository,
      llmModelPriceRepository,
    );
  }
  throw new Error(`Unsupported model: ${modelId}`);
};
