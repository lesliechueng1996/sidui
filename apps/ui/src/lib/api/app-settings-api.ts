import { apiClient } from '@/lib/api-client';

export const appSettingsQueryKey = ['app-settings'] as const;

export const listAppSettings = async () => {
  const { data, error } = await apiClient.api.v1['app-setting'].get();

  if (error) {
    throw new Error(error.value.message ?? '获取应用配置失败');
  }

  return data.data;
};
