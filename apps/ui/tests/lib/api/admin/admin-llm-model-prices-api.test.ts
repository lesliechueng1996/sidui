import { beforeEach, describe, expect, it, vi } from 'vitest';

const { priceGet, pricePost, pricePatch, priceDelete, priceSupersedePost } =
  vi.hoisted(() => ({
    priceGet: vi.fn(),
    pricePost: vi.fn(),
    pricePatch: vi.fn(),
    priceDelete: vi.fn(),
    priceSupersedePost: vi.fn(),
  }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'llm-model-price': Object.assign(
          (params: { id: string }) => ({
            delete: () => priceDelete(params),
            patch: (body: unknown) => pricePatch(params, body),
            supersede: {
              post: (body: unknown) => priceSupersedePost(params, body),
            },
          }),
          {
            get: priceGet,
            post: pricePost,
          },
        ),
      },
    },
  },
}));

describe('admin-llm-model-prices-api', () => {
  beforeEach(() => {
    priceGet.mockReset();
    pricePost.mockReset();
    pricePatch.mockReset();
    priceDelete.mockReset();
    priceSupersedePost.mockReset();
  });

  it('lists prices and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', amount: '4' }], total: 1 };
    priceGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListLlmModelPrices } = await import(
      '@/lib/api/admin/admin-llm-model-prices-api'
    );
    await expect(
      adminListLlmModelPrices({
        page: 1,
        pageSize: 20,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        currentOnly: true,
      }),
    ).resolves.toEqual(payload);
    expect(priceGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        currentOnly: true,
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    priceGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListLlmModelPrices } = await import(
      '@/lib/api/admin/admin-llm-model-prices-api'
    );
    await expect(
      adminListLlmModelPrices({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    priceGet.mockResolvedValue({ data: null, error: { value: {} } });
    pricePost.mockResolvedValue({ error: { value: {} } });
    pricePatch.mockResolvedValue({ error: { value: {} } });
    priceSupersedePost.mockResolvedValue({ error: { value: {} } });
    priceDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-llm-model-prices-api');

    await expect(
      api.adminListLlmModelPrices({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取模型价格列表失败');
    await expect(
      api.adminCreateLlmModelPrice({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        unit: 'per_million_tokens',
        amount: '4',
      }),
    ).rejects.toThrow('创建模型价格失败');
    await expect(
      api.adminSupersedeLlmModelPrice('1', { amount: '8' }),
    ).rejects.toThrow('调价失败');
    await expect(
      api.adminUpdateLlmModelPrice('1', { amount: '8' }),
    ).rejects.toThrow('更新模型价格失败');
    await expect(api.adminDeleteLlmModelPrice('1')).rejects.toThrow(
      '删除模型价格失败',
    );
  });

  it('creates, supersedes, updates, and deletes', async () => {
    pricePost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    priceSupersedePost.mockResolvedValue({
      data: { data: { id: '2' } },
      error: null,
    });
    pricePatch.mockResolvedValue({
      data: { data: { id: '1', amount: '8' } },
      error: null,
    });
    priceDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-llm-model-prices-api');

    await expect(
      api.adminCreateLlmModelPrice({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        unit: 'per_million_tokens',
        amount: '4',
        currency: 'CNY',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).resolves.toEqual({ id: 'n' });
    await expect(
      api.adminSupersedeLlmModelPrice('1', {
        amount: '8',
        unit: 'per_call',
        currency: 'CNY',
        effectiveFrom: '2026-04-01T00:00:00.000Z',
      }),
    ).resolves.toEqual({ id: '2' });
    await expect(
      api.adminUpdateLlmModelPrice('1', {
        amount: '8',
        unit: 'per_call',
        currency: 'CNY',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).resolves.toEqual({ id: '1', amount: '8' });
    expect(pricePatch).toHaveBeenCalledWith(
      { id: '1' },
      {
        amount: '8',
        unit: 'per_call',
        currency: 'CNY',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      },
    );
    await api.adminDeleteLlmModelPrice('1');
    expect(priceDelete).toHaveBeenCalledWith({ id: '1' });
  });
});
