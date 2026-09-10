import { apiClient } from '@/lib/api-client';

export type AppSettingKey = 'currentSeason' | 'raidIncomeChart';

export const adminListAppSettings = async () => {
  const { data, error } = await apiClient.api.v1['app-setting'].get();

  if (error) {
    throw new Error(error.value.message ?? '获取应用配置失败');
  }

  return data.data;
};

export type AdminAppSettingListItem = Awaited<
  ReturnType<typeof adminListAppSettings>
>['items'][number];

export const adminUpdateAppSetting = async (
  key: AppSettingKey,
  value: unknown,
) => {
  const { data, error } = await apiClient.api.v1['app-setting']({
    key,
  }).put({
    value,
  });

  if (error) {
    throw new Error(error.value.message ?? '保存配置失败');
  }

  return data.data;
};
