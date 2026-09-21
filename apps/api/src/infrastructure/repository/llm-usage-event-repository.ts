import type { ListLlmUsageEventsQuery } from '@api/interface/schema/llm-usage-event-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  ilike,
  llmUsageEvent,
  type SQL,
  sql,
} from '@api/shared/util/db';

type LlmUsageEventInsert = typeof llmUsageEvent.$inferInsert;

export class LlmUsageEventRepository {
  async create(values: LlmUsageEventInsert) {
    const [result] = await db.insert(llmUsageEvent).values(values).returning();
    return result;
  }

  buildWhereClause(query: ListLlmUsageEventsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.provider) {
      conditions.push(ilike(llmUsageEvent.provider, `%${query.provider}%`));
    }

    if (query.modelId) {
      conditions.push(ilike(llmUsageEvent.modelId, `%${query.modelId}%`));
    }

    if (query.feature) {
      conditions.push(eq(llmUsageEvent.feature, query.feature));
    }

    if (query.userId) {
      conditions.push(eq(llmUsageEvent.userId, query.userId));
    }

    if (query.status) {
      conditions.push(eq(llmUsageEvent.status, query.status));
    }

    if (query.createdFrom) {
      conditions.push(
        sql`(${llmUsageEvent.createdAt} AT TIME ZONE 'Asia/Shanghai')::date >= ${query.createdFrom}::date`,
      );
    }

    if (query.createdTo) {
      conditions.push(
        sql`(${llmUsageEvent.createdAt} AT TIME ZONE 'Asia/Shanghai')::date <= ${query.createdTo}::date`,
      );
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(llmUsageEvent)
      .where(where)
      .orderBy(desc(llmUsageEvent.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(llmUsageEvent).where(where);
  }
}

export type LlmUsageEventWriter = Pick<LlmUsageEventRepository, 'create'>;

export const llmUsageEventRepository = new LlmUsageEventRepository();
