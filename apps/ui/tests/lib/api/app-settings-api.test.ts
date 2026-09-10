import { beforeEach, describe, expect, it, vi } from 'vitest';

const { appSettingGet } = vi.hoisted(() => ({
  appSettingGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'app-setting': {
          get: appSettingGet,
        },
      },
    },
  },
}));

describe('app-settings-api', () => {
  beforeEach(() => {
    appSettingGet.mockReset();
  });

  it('lists settings and unwraps the envelope', async () => {
    const payload = { items: [{ key: 'currentSeason', value: null }] };
    appSettingGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { listAppSettings } = await import('@/lib/api/app-settings-api');
    await expect(listAppSettings()).resolves.toEqual(payload);
  });

  it('throws the API message when listing fails', async () => {
    appSettingGet.mockResolvedValue({
      data: null,
      error: { value: { message: '失败' } },
    });
    const { listAppSettings } = await import('@/lib/api/app-settings-api');
    await expect(listAppSettings()).rejects.toThrow('失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    appSettingGet.mockResolvedValue({ data: null, error: { value: {} } });
    const { listAppSettings } = await import('@/lib/api/app-settings-api');
    await expect(listAppSettings()).rejects.toThrow('获取应用配置失败');
  });
});
