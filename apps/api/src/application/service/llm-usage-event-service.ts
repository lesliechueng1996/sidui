import { llmUsageEventRepository } from '@api/infrastructure/repository/llm-usage-event-repository';
import type {
  ListLlmUsageEventsQuery,
  LlmUsageEventDetail,
} from '@api/interface/schema/llm-usage-event-schema';
import { formatDateTime } from '@api/shared/util/date';

type LlmUsageEventRow = Awaited<
  ReturnType<typeof llmUsageEventRepository.listPagination>
>[number];

const toUsageEventDetail = (row: LlmUsageEventRow): LlmUsageEventDetail => ({
  id: row.id,
  provider: row.provider,
  modelId: row.modelId,
  feature: row.feature,
  userId: row.userId,
  status: row.status as LlmUsageEventDetail['status'],
  inputTokens: row.inputTokens,
  cacheReadTokens: row.cacheReadTokens,
  cacheWriteTokens: row.cacheWriteTokens,
  outputTokens: row.outputTokens,
  reasoningTokens: row.reasoningTokens,
  webSearchCalls: row.webSearchCalls,
  estimatedCost: row.estimatedCost,
  currency: row.currency,
  priceSnapshot: row.priceSnapshot,
  usageRaw: row.usageRaw,
  durationMs: row.durationMs,
  providerResponseId: row.providerResponseId,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

export const listAdminLlmUsageEvents = async (
  query: ListLlmUsageEventsQuery,
): Promise<{
  items: LlmUsageEventDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = llmUsageEventRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    llmUsageEventRepository.listPagination(where, query.pageSize, offset),
    llmUsageEventRepository.count(where),
  ]);

  return {
    items: rows.map(toUsageEventDetail),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};
