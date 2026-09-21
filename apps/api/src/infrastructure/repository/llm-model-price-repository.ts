import type { ListLlmModelPricesQuery } from '@api/interface/schema/llm-model-price-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  ilike,
  isNull,
  llmModelPrice,
  lte,
  type SQL,
} from '@api/shared/util/db';

type LlmModelPrice = typeof llmModelPrice.$inferSelect;
type LlmModelPriceInsert = typeof llmModelPrice.$inferInsert;

type LlmModelPriceCreate = Pick<
  LlmModelPriceInsert,
  | 'provider'
  | 'modelId'
  | 'dimension'
  | 'unit'
  | 'amount'
  | 'currency'
  | 'source'
  | 'effectiveFrom'
>;

type LlmModelPriceUpdate = Pick<
  LlmModelPriceInsert,
  'unit' | 'amount' | 'currency' | 'effectiveFrom'
>;

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

  buildWhereClause(query: ListLlmModelPricesQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.provider) {
      conditions.push(ilike(llmModelPrice.provider, `%${query.provider}%`));
    }

    if (query.modelId) {
      conditions.push(ilike(llmModelPrice.modelId, `%${query.modelId}%`));
    }

    if (query.dimension) {
      conditions.push(eq(llmModelPrice.dimension, query.dimension));
    }

    if (query.currentOnly !== false) {
      conditions.push(isNull(llmModelPrice.effectiveTo));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(llmModelPrice)
      .where(where)
      .orderBy(desc(llmModelPrice.effectiveFrom), desc(llmModelPrice.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(llmModelPrice).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(llmModelPrice)
      .where(eq(llmModelPrice.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findCurrent(provider: string, modelId: string, dimension: string) {
    const result = await db
      .select()
      .from(llmModelPrice)
      .where(
        and(
          eq(llmModelPrice.provider, provider),
          eq(llmModelPrice.modelId, modelId),
          eq(llmModelPrice.dimension, dimension),
          isNull(llmModelPrice.effectiveTo),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async create(values: LlmModelPriceCreate) {
    const [created] = await db
      .insert(llmModelPrice)
      .values({
        ...values,
        effectiveTo: null,
      })
      .returning();
    return created;
  }

  async supersedeCurrent(
    currentId: string,
    effectiveTo: Date,
    values: LlmModelPriceCreate,
  ) {
    return db.transaction(async (tx) => {
      const [closed] = await tx
        .update(llmModelPrice)
        .set({ effectiveTo })
        .where(eq(llmModelPrice.id, currentId))
        .returning();

      if (!closed) {
        return null;
      }

      const [created] = await tx
        .insert(llmModelPrice)
        .values({
          ...values,
          effectiveTo: null,
        })
        .returning();

      return created ?? null;
    });
  }

  async updateById(id: string, values: LlmModelPriceUpdate) {
    const [updated] = await db
      .update(llmModelPrice)
      .set(values)
      .where(eq(llmModelPrice.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(llmModelPrice).where(eq(llmModelPrice.id, id));
  }
}

export type LlmCurrentPriceReader = Pick<
  LlmModelPriceRepository,
  'findByProviderAndModelId'
>;

export const llmModelPriceRepository = new LlmModelPriceRepository();
