import { beforeEach, describe, expect, it, vi } from 'vitest';

const { usageGet } = vi.hoisted(() => ({
  usageGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'llm-usage-event': {
          get: usageGet,
        },
      },
    },
  },
}));

describe('admin-llm-usage-events-api', () => {
  beforeEach(() => {
    usageGet.mockReset();
  });

  it('lists usage events and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1' }], total: 1 };
    usageGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListLlmUsageEvents } = await import(
      '@/lib/api/admin/admin-llm-usage-events-api'
    );
    await expect(
      adminListLlmUsageEvents({
        page: 2,
        pageSize: 10,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        feature: 'lyric-song-base-info',
        userId: 'user-1',
        status: 'success',
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31',
      }),
    ).resolves.toEqual(payload);
    expect(usageGet).toHaveBeenCalledWith({
      query: {
        page: 2,
        pageSize: 10,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        feature: 'lyric-song-base-info',
        userId: 'user-1',
        status: 'success',
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31',
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    usageGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListLlmUsageEvents } = await import(
      '@/lib/api/admin/admin-llm-usage-events-api'
    );
    await expect(
      adminListLlmUsageEvents({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    usageGet.mockResolvedValue({ data: null, error: { value: {} } });
    const { adminListLlmUsageEvents } = await import(
      '@/lib/api/admin/admin-llm-usage-events-api'
    );
    await expect(
      adminListLlmUsageEvents({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取用量事件列表失败');
  });
});
