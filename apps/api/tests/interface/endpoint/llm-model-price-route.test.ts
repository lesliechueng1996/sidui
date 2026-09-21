import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const priceDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  dimension: 'prompt' as const,
  unit: 'per_million_tokens' as const,
  amount: '4',
  currency: 'CNY',
  source: 'manual' as const,
  status: 'current' as const,
  effectiveFrom: '2026-01-01 00:00:00',
  effectiveTo: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminLlmModelPrices = mock(async () => ({
  items: [priceDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const createAdminLlmModelPrice = mock(async () => priceDetail);
const getAdminLlmModelPrice = mock(async () => priceDetail);
const supersedeAdminLlmModelPrice = mock(async () => ({
  ...priceDetail,
  id: '22222222-2222-4222-8222-222222222222',
  amount: '8',
}));
const updateAdminLlmModelPrice = mock(async () => priceDetail);
const deleteAdminLlmModelPrice = mock(async () => undefined);

mock.module('@api/application/service/llm-model-price-service', () => ({
  listAdminLlmModelPrices,
  createAdminLlmModelPrice,
  getAdminLlmModelPrice,
  supersedeAdminLlmModelPrice,
  updateAdminLlmModelPrice,
  deleteAdminLlmModelPrice,
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

const { llmModelPriceRoute, llmModelPriceTag } = await import(
  '@api/interface/endpoint/llm-model-price-route'
);

const priceId = priceDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  llmModelPriceRoute.handle(
    new Request(`http://localhost/api/v1/llm-model-price${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('llmModelPriceRoute', () => {
  beforeEach(() => {
    listAdminLlmModelPrices.mockReset();
    createAdminLlmModelPrice.mockReset();
    getAdminLlmModelPrice.mockReset();
    supersedeAdminLlmModelPrice.mockReset();
    updateAdminLlmModelPrice.mockReset();
    deleteAdminLlmModelPrice.mockReset();

    listAdminLlmModelPrices.mockResolvedValue({
      items: [priceDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    createAdminLlmModelPrice.mockResolvedValue(priceDetail);
    getAdminLlmModelPrice.mockResolvedValue(priceDetail);
    supersedeAdminLlmModelPrice.mockResolvedValue({
      ...priceDetail,
      id: '22222222-2222-4222-8222-222222222222',
      amount: '8',
    });
    updateAdminLlmModelPrice.mockResolvedValue({
      ...priceDetail,
      amount: '8',
    });
    deleteAdminLlmModelPrice.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(llmModelPriceTag).toEqual({
      name: 'llm-model-price',
      description: 'LLM model price API',
    });
  });

  it('lists prices', async () => {
    const response = await jsonRequest(
      '?page=1&pageSize=20&provider=kimi&modelId=kimi-k2.6&dimension=prompt&currentOnly=true',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminLlmModelPrices).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a price', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        unit: 'per_million_tokens',
        amount: '4',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminLlmModelPrice).toHaveBeenCalled();
    expect(body.data.id).toBe(priceId);
  });

  it('gets a price', async () => {
    const response = await jsonRequest(`/${priceId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminLlmModelPrice).toHaveBeenCalledWith(priceId);
    expect(body.data.provider).toBe('kimi');
  });

  it('supersedes a price', async () => {
    const response = await jsonRequest(`/${priceId}/supersede`, {
      method: 'POST',
      body: JSON.stringify({ amount: '8' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(supersedeAdminLlmModelPrice).toHaveBeenCalled();
    expect(body.data.amount).toBe('8');
  });

  it('updates a price', async () => {
    const response = await jsonRequest(`/${priceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: '8' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateAdminLlmModelPrice).toHaveBeenCalled();
    expect(body.data.amount).toBe('8');
  });

  it('deletes a price', async () => {
    const response = await jsonRequest(`/${priceId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminLlmModelPrice).toHaveBeenCalledWith(priceId);
    expect(body.data).toBeNull();
  });
});
