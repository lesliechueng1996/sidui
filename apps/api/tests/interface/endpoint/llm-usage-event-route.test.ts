import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const usageDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  feature: 'lyric-song-base-info',
  userId: 'user-1',
  status: 'success' as const,
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
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminLlmUsageEvents = mock(async () => ({
  items: [usageDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));

mock.module('@api/application/service/llm-usage-event-service', () => ({
  listAdminLlmUsageEvents,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({}),
  }),
}));

const { llmUsageEventRoute, llmUsageEventTag } = await import(
  '@api/interface/endpoint/llm-usage-event-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  llmUsageEventRoute.handle(
    new Request(`http://localhost/api/v1/llm-usage-event${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('llmUsageEventRoute', () => {
  beforeEach(() => {
    listAdminLlmUsageEvents.mockReset();
    listAdminLlmUsageEvents.mockResolvedValue({
      items: [usageDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('exports an OpenAPI tag', () => {
    expect(llmUsageEventTag).toEqual({
      name: 'llm-usage-event',
      description: 'LLM usage event API',
    });
  });

  it('lists usage events with filters and pagination', async () => {
    const response = await jsonRequest(
      '?page=2&pageSize=10&provider=kimi&modelId=kimi-k2.6&feature=lyric-song-base-info&userId=user-1&status=success&createdFrom=2026-01-01&createdTo=2026-01-31',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminLlmUsageEvents).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.data.items[0].id).toBe(usageDetail.id);
    expect(body.code).toBe('SUCCESS');
  });

  it('rejects an invalid status', async () => {
    const response = await jsonRequest('?status=unknown');

    expect(response.status).toBe(422);
    expect(listAdminLlmUsageEvents).not.toHaveBeenCalled();
  });
});
