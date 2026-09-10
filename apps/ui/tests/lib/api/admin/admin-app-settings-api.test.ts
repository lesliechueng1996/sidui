import { beforeEach, describe, expect, it, vi } from 'vitest';

const { appSettingGet, appSettingPut } = vi.hoisted(() => ({
  appSettingGet: vi.fn(),
  appSettingPut: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'app-setting': Object.assign(
          (params: { key: string }) => ({
            put: (body: unknown) => appSettingPut(params, body),
          }),
          {
            get: appSettingGet,
          },
        ),
      },
    },
  },
}));

describe('admin-app-settings-api', () => {
  beforeEach(() => {
    appSettingGet.mockReset();
    appSettingPut.mockReset();
  });

  it('lists settings and unwraps the envelope', async () => {
    const payload = { items: [{ key: 'currentSeason', value: null }] };
    appSettingGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListAppSettings } = await import(
      '@/lib/api/admin/admin-app-settings-api'
    );
    await expect(adminListAppSettings()).resolves.toEqual(payload);
    expect(appSettingGet).toHaveBeenCalled();
  });

  it('updates a setting', async () => {
    const item = {
      key: 'currentSeason',
      value: { seasonId: '11111111-1111-4111-8111-111111111111' },
      updatedAt: '2026-01-02 00:00:00',
    };
    appSettingPut.mockResolvedValue({ data: { data: item }, error: null });

    const { adminUpdateAppSetting } = await import(
      '@/lib/api/admin/admin-app-settings-api'
    );
    await expect(
      adminUpdateAppSetting('currentSeason', item.value),
    ).resolves.toEqual(item);
    expect(appSettingPut).toHaveBeenCalledWith(
      { key: 'currentSeason' },
      { value: item.value },
    );
  });

  it('throws API messages and fallbacks', async () => {
    appSettingGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListAppSettings, adminUpdateAppSetting } = await import(
      '@/lib/api/admin/admin-app-settings-api'
    );
    await expect(adminListAppSettings()).rejects.toThrow('列表失败');

    appSettingGet.mockResolvedValue({ data: null, error: { value: {} } });
    await expect(adminListAppSettings()).rejects.toThrow('获取应用配置失败');

    appSettingPut.mockResolvedValue({
      error: { value: { message: '赛季不存在' } },
    });
    await expect(adminUpdateAppSetting('currentSeason', {})).rejects.toThrow(
      '赛季不存在',
    );

    appSettingPut.mockResolvedValue({ error: { value: {} } });
    await expect(adminUpdateAppSetting('currentSeason', {})).rejects.toThrow(
      '保存配置失败',
    );
  });
});
