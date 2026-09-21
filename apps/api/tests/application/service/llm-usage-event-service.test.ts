import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ListLlmUsageEventsQuery } from '@api/interface/schema/llm-usage-event-schema';

type UsageRow = {
  id: string;
  provider: string;
  modelId: string;
  feature: string;
  userId: string;
  status: string;
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  webSearchCalls: number;
  estimatedCost: string;
  currency: string;
  priceSnapshot: {
    currency: string;
    prices: Array<{
      id: string;
      dimension: string;
      unit: string;
      amount: string;
    }>;
  };
  usageRaw: unknown;
  durationMs: number | null;
  providerResponseId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const usageRow = (overrides: Partial<UsageRow> = {}): UsageRow => ({
  id: 'event-1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  feature: 'lyric-song-base-info',
  userId: 'user-1',
  status: 'success',
  inputTokens: 10,
  cacheReadTokens: 2,
  cacheWriteTokens: 1,
  outputTokens: 20,
  reasoningTokens: 0,
  webSearchCalls: 0,
  estimatedCost: '0.00120000',
  currency: 'CNY',
  priceSnapshot: {
    currency: 'CNY',
    prices: [
      {
        id: 'price-1',
        dimension: 'prompt',
        unit: 'per_million_tokens',
        amount: '4',
      },
    ],
  },
  usageRaw: { inputTokens: 10 },
  durationMs: 120,
  providerResponseId: 'resp-1',
  createdAt,
  updatedAt,
  ...overrides,
});

const buildWhereClause = mock<(query: ListLlmUsageEventsQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<UsageRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module(
  '@api/infrastructure/repository/llm-usage-event-repository',
  () => ({
    llmUsageEventRepository: {
      buildWhereClause,
      listPagination,
      count,
    },
  }),
);
mock.module('@api/shared/util/date', () => ({ formatDateTime }));

const { listAdminLlmUsageEvents } = await import(
  '@api/application/service/llm-usage-event-service'
);

const listQuery = (
  overrides: Partial<ListLlmUsageEventsQuery> = {},
): ListLlmUsageEventsQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('llm-usage-event-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    formatDateTime.mockReset();
    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    formatDateTime.mockImplementation((date) => `fmt:${date.toISOString()}`);
  });

  it('lists usage events and maps fields', async () => {
    const where = { mocked: true };
    buildWhereClause.mockReturnValue(where);
    listPagination.mockResolvedValue([usageRow(), usageRow({ id: 'event-2' })]);
    count.mockResolvedValue([{ total: 5 }]);

    const result = await listAdminLlmUsageEvents(
      listQuery({
        provider: 'kimi',
        modelId: 'kimi',
        feature: 'lyric-song-base-info',
        userId: 'user-1',
        status: 'success',
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31',
        page: 2,
        pageSize: 10,
      }),
    );

    expect(buildWhereClause).toHaveBeenCalled();
    expect(listPagination).toHaveBeenCalledWith(where, 10, 10);
    expect(count).toHaveBeenCalledWith(where);
    expect(result.total).toBe(5);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: 'event-1',
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      feature: 'lyric-song-base-info',
      userId: 'user-1',
      status: 'success',
      inputTokens: 10,
      cacheReadTokens: 2,
      cacheWriteTokens: 1,
      outputTokens: 20,
      reasoningTokens: 0,
      webSearchCalls: 0,
      estimatedCost: '0.00120000',
      currency: 'CNY',
      priceSnapshot: {
        currency: 'CNY',
        prices: [
          {
            id: 'price-1',
            dimension: 'prompt',
            unit: 'per_million_tokens',
            amount: '4',
          },
        ],
      },
      usageRaw: { inputTokens: 10 },
      durationMs: 120,
      providerResponseId: 'resp-1',
      createdAt: 'fmt:2026-01-01T00:00:00.000Z',
      updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
    });
  });

  it('defaults list total to 0 when count is empty', async () => {
    count.mockResolvedValue([]);

    const result = await listAdminLlmUsageEvents(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
