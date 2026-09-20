import { and, db, eq, isNull, llmModelPrice, lte } from '@api/shared/util/db';

type LlmModelPrice = typeof llmModelPrice.$inferSelect;

export class LlmModelPriceRepository {
  async findByProviderAndModelId(
    provider: string,
    modelId: string,
  ): Promise<Array<LlmModelPrice>> {
    const now = new Date();

    return db
      .select()
      .from(llmModelPrice)
      .where(
        and(
          eq(llmModelPrice.provider, provider),
          eq(llmModelPrice.modelId, modelId),
          isNull(llmModelPrice.effectiveTo),
          lte(llmModelPrice.effectiveFrom, now),
        ),
      );
  }
}

export const llmModelPriceRepository = new LlmModelPriceRepository();
