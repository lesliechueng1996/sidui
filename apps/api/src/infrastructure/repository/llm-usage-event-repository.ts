import { db, llmUsageEvent } from '@api/shared/util/db';

type LlmUsageEventInsert = typeof llmUsageEvent.$inferInsert;

export class LlmUsageEventRepository {
  async create(values: LlmUsageEventInsert) {
    const [result] = await db.insert(llmUsageEvent).values(values).returning();
    return result;
  }
}

export const llmUsageEventRepository = new LlmUsageEventRepository();
